const Bid = require("../models/Bid");
const Auction = require("../models/Auction");
const mongoose = require("mongoose");
const { StatusCodes } = require("http-status-codes");
const createError = require("http-errors");

//helper function to mask username
function maskUsername(username) {
  if (!username) return "";
  const length = username.length;
  if (length <= 2) return username; // don't mask very short names
  const start = Math.floor((length - 5) / 2);
  const end = start + 5;
  const masked = username.slice(0, start) + "*****" + username.slice(end);
  return masked;
}

async function placeBid(req, res) {
  const {
    user: { userId },
    params: { auctionId },
    body: { amount, bidType },
  } = req;

  const auction = await Auction.findById(auctionId);

  if (!auction) {
    throw createError(
      StatusCodes.NOT_FOUND,
      `No auction with id ${auctionId} found for this user`,
    );
  }

  if (auction.status !== "active") {
    throw createError(StatusCodes.BAD_REQUEST, "Auction is no longer active");
  }

  if (new Date(auction.endTime) < new Date()) {
    throw createError(StatusCodes.BAD_REQUEST, "Auction has ended");
  }

  let bidAmount;
  const basePrice = auction.currentPrice;

  if (bidType && bidType !== "custom") {
    // Calculate percentage
    const percentage = parseInt(bidType) / 100; // Convert "10%" to 0.10
    bidAmount = Math.round((basePrice + (basePrice * percentage)) * 100) / 100; // Add percentage on top
  } else if (amount) {
    // Custom amount
    bidAmount = amount;
  } else {
    throw createError(StatusCodes.BAD_REQUEST, "Please provide a bid amount");
  }

  if (bidAmount <= auction.currentPrice) {
    throw createError(
      StatusCodes.BAD_REQUEST,
      `Bid must be higher than current price of ${auction.currentPrice}`,
    );
  }

  if (auction.createdBy.toString() === userId) {
    throw createError(
      StatusCodes.BAD_REQUEST,
      "You cannot bid on your own auction",
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create the bid inside the transaction
    const [bid] = await Bid.create(
      [{ amount: bidAmount, bidder: userId, auction: auctionId }],
      { session },
    );

    // Update the auction inside the same transaction
    const updatedAuction = await Auction.findOneAndUpdate(
      { _id: auctionId, currentPrice: basePrice },
      { currentPrice: bidAmount, highestBidder: userId },
      { returnDocument: "after", session },
    );

    if (!updatedAuction) {
      throw createError(
        StatusCodes.CONFLICT,
        "Auction price changed, please retry",
      );
    }

    // Commit the transaction – both operations succeed together
    await session.commitTransaction();
    session.endSession();

    const io = req.app.get("io");

    io.to(`auction-${auctionId}`).emit("newBid", {
      bid,
      auction: updatedAuction,
    });

    const previousBidders = await Bid.distinct("bidder", { auction: auctionId });

    // Exclude the current bidder
    const biddersToNotify = previousBidders.filter(
      (bidderId) => bidderId.toString() !== userId
    );

    for (const bidderId of biddersToNotify) {
      io.to(`user-${bidderId}`).emit("outbid", {
        auctionId,
        auctionName: auction.name,
        currentPrice: bidAmount,
        message: `You've been outbid on "${auction.name}". Bid again to stay in the lead!`,
      });
    }

    res.status(StatusCodes.CREATED).json({
      msg: "Bid placed successfully!",
      bid,
      auction: updatedAuction,
    });
  } catch (error) {
    // If anything fails, abort the transaction – all changes are rolled back
    await session.abortTransaction();
    session.endSession();
    throw error; // let your global error handler deal with it
  }
}

async function auctionBidHistory(req, res) {
  const {
    params: { auctionId },
  } = req;

  const auction = await Auction.findById(auctionId);

  if (!auction) {
    throw createError(
      StatusCodes.NOT_FOUND,
      `No auction with id ${auctionId} found for this user`,
    );
  }

  const bids = await Bid.find({ auction: auctionId })
    .sort("createdAt")
    .populate("bidder", "username");

  const maskedBids = bids.map((bid) => {
    const bidObj = bid.toObject();
    if (bidObj.bidder && bidObj.bidder.username) {
      bidObj.bidder.username = maskUsername(bidObj.bidder.username);
    }
    return bidObj;
  });

  res.status(StatusCodes.OK).json({
    msg: "Auction bid history retrieved successfully!",
    bids: maskedBids,
    count: bids.length,
  });
}

module.exports = {
  placeBid,
  auctionBidHistory,
};
