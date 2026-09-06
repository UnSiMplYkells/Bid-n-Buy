const express = require("express")
const router = express.Router()
const {
  placeBid,
  auctionBidHistory,
} = require("../controllers/bids");
  

router.route("/:auctionId").post(placeBid)
router.route("/history/:auctionId").get(auctionBidHistory);

module.exports = router;
