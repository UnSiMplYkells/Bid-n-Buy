const Auction = require("../models/Auction");
const { StatusCodes } = require("http-status-codes");
const createError = require("http-errors");
const { getLatestBids } = require("../services/auctionService");

async function createAuction(req, res) {
  req.body.createdBy = req.user.userId;
  const auction = await Auction.create(req.body);
  res.status(StatusCodes.CREATED).json({
    msg: "Auction created successfully!",
    auction,
  });
}

async function getAllAuction(req, res) {
  const { status, name } = req.query;
  const queryObject = {};

  if (status) {
    queryObject.status = status;
  }

  if (name) {
    queryObject.name = { $regex: name, $options: "i" };
  }

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const auctions = await Auction.find(queryObject)
    .sort("-createdAt")
    .skip(skip)
    .limit(limit)
    .lean();

  const auctionIds = auctions.map((auction) => auction._id);

  const latestBids = await getLatestBids(auctionIds);

  const auctionsData = auctions.map((auction) => {
    const latestBid = latestBids.find(
      (bid) => bid.auction.toString() === auction._id.toString(),
    );

    return {
      ...auction,
      latestBid: latestBid || null, // Will be null if no one has bid yet
    };
  });

  res.status(StatusCodes.OK).json({
    msg: "All auctions retrieved successfully!",
    auctions: auctionsData,
    count: auctionsData.length,
    page,
    limit,
  });
}

async function getUserAuction(req, res) {
  const { status, name } = req.query;
  const queryObject = {};

  if (status) {
    queryObject.status = status;
  }

  if (name) {
    queryObject.name = { $regex: name, $options: "i" };
  }

  const auctions = await Auction.find({
    createdBy: req.user.userId,
    ...queryObject,
  }).sort("createdAt");

  res.status(StatusCodes.OK).json({
    msg: "User auctions retrieved successfully!",
    auctions,
    count: auctions.length,
  });
}

async function getAuctionDetails(req, res) {
  const { id: auctionId } = req.params;

  const auction = await Auction.findById(auctionId);

  if (!auction) {
    throw createError(StatusCodes.NOT_FOUND, `No auction with id ${auctionId}`);
  }

  const latestBidsArray = await getLatestBids([auctionId]);

  const latestBid = latestBidsArray.length > 0 ? latestBidsArray[0] : null;

  res.status(StatusCodes.OK).json({
    msg: "Auction details retrieved successfully!",
    auction,
    latestBid,
  });
}

async function editAuction(req, res) {
  const {
    body: { image, desc, name, askingPrice },
    user: { userId },
    params: { id: auctionId },
  } = req;

  const auction = await Auction.findOne({
    _id: auctionId,
    createdBy: userId,
  });

  if (!auction) {
    throw createError(
      StatusCodes.NOT_FOUND,
      `No auction with id ${auctionId} found for this user`,
    );
  }

  if (auction.status !== "active") {
    throw createError(
      StatusCodes.BAD_REQUEST,
      "You cannot edit an auction that has already closed.",
    );
  }

  if (auction.currentPrice > auction.askingPrice && askingPrice) {
    throw createError(
      StatusCodes.BAD_REQUEST,
      "You cannot change the starting price after bids have been placed.",
    );
  }

  const allowedUpdates = {};
  if (name) allowedUpdates.name = name;
  if (desc) allowedUpdates.desc = desc;
  if (image) allowedUpdates.image = image;

  // Only update askingPrice if no bids are placed
  if (
    !auction.highestBidder &&
    askingPrice &&
    auction.currentPrice === auction.askingPrice
  ) {
    allowedUpdates.askingPrice = askingPrice;
    // Keep the current price synced with the new asking price
    allowedUpdates.currentPrice = askingPrice;
  }

  const updatedAuction = await Auction.findByIdAndUpdate(
    auctionId,
    allowedUpdates,
    {
      new: true,
      runValidators: true,
    },
  );

  res.status(StatusCodes.OK).json({
    msg: "Auction details updated successfully!",
    auction: updatedAuction,
  });
}

async function deleteAuction(req, res) {
  const {
    user: { userId },
    params: { id: auctionId },
  } = req;

  const auction = await Auction.findOneAndDelete({
    _id: auctionId,
    status: "closed",
    createdBy: userId,
  });

  if (!auction) {
    const existing = await Auction.findOne({
      _id: auctionId,
      createdBy: userId,
    });

    if (!existing) {
      throw createError(
        StatusCodes.NOT_FOUND,
        `No auction with id ${auctionId}`,
      );
    }

    throw createError(
      StatusCodes.BAD_REQUEST,
      `Cannot delete an active auction`,
    );
  }

  res.status(StatusCodes.OK).json({ msg: "Deleted!" });
}

async function closeAuction(req, res) {
  const {
    user: { userId },
    params: { id: auctionId },
  } = req;

  const auction = await Auction.findOne({
    _id: auctionId,
    createdBy: userId,
  });

  if (!auction) {
    throw createError(
      StatusCodes.NOT_FOUND,
      `No auction with id ${auctionId} found for this user`,
    );
  }

  if (auction.status !== "active") {
    throw createError(StatusCodes.BAD_REQUEST, "Auction already closed");
  }

  const closeAuction = await Auction.findByIdAndUpdate(
    auctionId,
    { status: "closed" },
    {
      new: true,
      runValidators: true,
    },
  );

  res.status(StatusCodes.OK).json({
    msg: "Auction closed successfully!",
    auction: closeAuction,
  });
}

module.exports = {
  createAuction,
  getAllAuction,
  getUserAuction,
  getAuctionDetails,
  editAuction,
  deleteAuction,
  closeAuction,
};
