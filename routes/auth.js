const express = require("express");
const router = express.Router();
const { register, login, logout, refreshToken } = require("../controllers/auth");
const auth = require("../middleware/authentication");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", auth, logout);
router.post("/refresh", refreshToken);

module.exports = router;