const Auction = require("../models/Auction");
const Bid = require("../models/Bid");
const User = require("../models/User")

async function getUserProfile(userId) {
  return await User.findById(userId)
    .select("-password -__v")
    .exec();
};

async function getUserCurrentBids(userId) {
  const bids = await Bid.find({ bidder: userId })
    .sort({ createdAt: -1 }) // newest bids first
    .populate({
      path: "auction",
      match: { status: "active" },
    });

  const seenAuctions = new Set();

  const latestBids = bids.filter((bid) => {
    // Drop bids on closed auctions (populate sets them to null)
    if (!bid.auction) return false;

    const auctionId = bid.auction._id.toString();

    // Already saw this auction? This is an older bid, skip it
    if (seenAuctions.has(auctionId)) return false;

    // First time seeing this auction = this is the latest bid
    seenAuctions.add(auctionId);
    return true;
  });

  return latestBids;
}

async function getUserWins(userId) {
  return await Auction.find({ highestBidder: userId, status: "closed" }).exec();
};

module.exports = {
  getUserProfile,
  getUserCurrentBids,
  getUserWins,
};
