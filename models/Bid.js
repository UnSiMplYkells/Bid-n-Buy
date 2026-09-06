const mongoose = require("mongoose")

const BidSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    bidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    auction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auction",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Bid", BidSchema)