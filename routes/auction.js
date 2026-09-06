const express = require("express")
const router = express.Router()
const { 
  createAuction,
  getAllAuction,
  getUserAuction,
  getAuctionDetails,
  editAuction,
  deleteAuction,
  closeAuction } = require("../controllers/auctions")
  

router.route("/create").post(createAuction)
router.route("/all").get(getAllAuction)
router.route("/user/all").get(getUserAuction)
router.route("/:id").get(getAuctionDetails).patch(editAuction).delete(deleteAuction)
router.route("/:id/close").post(closeAuction)

module.exports = router;
