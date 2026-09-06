const Auction = require("../models/Auction");
const Bid = require("../models/Bid");
const User = require("../models/User")

async function getLatestBids(auctionIds) {
  if (!auctionIds || auctionIds.length === 0) return [];

  // Use $in to find all bids for all these auctions at once
  const bids = await Bid.find({ auction: { $in: auctionIds } })
    .sort({ createdAt: -1 }) // Newest bids first
    .lean(); 

  const latestBidsMap = new Map();

  for (const bid of bids) {
    const aId = bid.auction.toString();
    
    if (!latestBidsMap.has(aId)) {
      latestBidsMap.set(aId, bid);
    }
  }

  // Return the map values as a clean array
  return Array.from(latestBidsMap.values());
}

module.exports = {
  getLatestBids,
};
