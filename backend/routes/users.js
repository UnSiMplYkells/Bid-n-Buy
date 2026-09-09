const express = require("express");
const router = express.Router();

const {
  me,
  currentBids,
  wonBids,
  createUserProfile,
  uploadImage,
  deleteImage,
} = require("../controllers/users");
const upload = require("../middleware/multer");


router.route("/me").post(createUserProfile).get(me);
router.route("/me/bids").get(currentBids)
router.route("/me/wins").get(wonBids);

router.route("/:id/images").post(upload.single("image"),uploadImage).delete(deleteImage);

module.exports = router;
