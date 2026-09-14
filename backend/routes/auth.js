const express = require("express");
const router = express.Router();
const {
  register,
  login,
  logout,
  refreshToken,
  verifyEmail,
  resendVerification,
} = require("../controllers/auth");
const auth = require("../middleware/authentication");

router.post("/register", register);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", resendVerification);

router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refreshToken);

module.exports = router;