const express = require("express");
const router = express.Router();

const {
  me,
  currentBids,
  wonBids,
  createUserProfile,
} = require("../controllers/users");

router.route("/me").post(createUserProfile).get(me);
router.route("/me/bids").get(currentBids)
router.route("/me/wins").get(wonBids);

module.exports = router;