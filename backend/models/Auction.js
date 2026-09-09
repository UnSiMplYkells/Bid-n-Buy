const mongoose = require("mongoose")

//for multiple images, minimum 5.
// images: {
//   type: [String], // Changes from String to an array of Strings
//   validate: {
//     validator: function (v) {
//       return v && v.length >= 5; // Enforces minimum of 5 at the DB level
//     },
//     message: "An auction must have at least 5 images."
//   }
// }

const AuctionSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: [true, "Please provide an image"],
      default:
        "https://th.bing.com/th/id/OIP.3SwljyV2T5JnvEqkwrZMfQHaHa?w=156&h=180&c=7&r=0&o=7&pid=1.7&rm=3",
    },
    name: {
      type: String,
      required: [true, "Please provide name"],
      trim: true,
      maxLength: 50,
    },
    askingPrice: {
      type: Number,
      required: [true, "Please provide asking price"],
    },
    currentPrice: {
      type: Number,
      default: function () {
        // Defaults to the asking price when the auction is first created
        return this.askingPrice;
      },
    },
    desc: {
      type: String,
      trim: true,
      required: [true, "Please provide description"],
    },
    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
    },
    endTime: {
      type: Date,
      required: [true, "Please provide an end time for the auction"],
    },
    highestBidder: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide user"],
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  },
);

module.exports = mongoose.model("Auction", AuctionSchema);