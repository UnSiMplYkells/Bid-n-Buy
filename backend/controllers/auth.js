const { StatusCodes } = require("http-status-codes");
const createError = require("http-errors");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendEmail, SEND_REAL_EMAILS } = require("../utils/sendEmail");
const crypto = require("crypto");
require("dotenv").config();
const getRegisterEmailHtml = require("../utils/emails/register-email");

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

async function register(req, res) {
  const { email } = req.body;
  const verificationToken = crypto.randomBytes(32).toString("hex");

  const user = await User.create({
    ...req.body, //not best practice. supposed to destructure
    verificationToken,
    verificationTokenExpires: Date.now() + 3600000, // 1 hour from now
  });

  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
  const emailHtml = getRegisterEmailHtml(verificationUrl);

  try {
    await sendEmail({
      to: email,
      subject: "Verify your email",
      html: emailHtml,
    });
  } catch (err) {
    // don't leave a half-created account the user can never verify
    await User.findByIdAndDelete(user._id);
    throw createError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Could not send verification email. Please try again.",
    );
  }

  // const accessToken = user.createJWT();
  // const refreshToken = user.createRefreshToken();

  // user.refreshToken = refreshToken;
  // await user.save();

  // Send refresh token as httpOnly cookie
  // res.cookie("refreshToken", refreshToken, {
  //   httpOnly: true,
  //   secure: process.env.NODE_ENV === "production",
  //   sameSite: "strict",
  //   maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  // });

  const response = {
    msg: "Please check your email to verify your account.(Do well to check your spam too)",
    user: { email: user.email },
  };

  if (!SEND_REAL_EMAILS) {
    response.devVerificationUrl = verificationUrl;
  }

  res.status(StatusCodes.CREATED).json(response);
}

async function verifyEmail(req, res) {
  const { token } = req.params;
  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpires: { $gt: Date.now() },
  }).select("+verificationToken +verificationTokenExpires");

  if (!user) {
    throw createError(
      StatusCodes.BAD_REQUEST,
      "Invalid or expired verification token",
    );
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;

  await user.save();

  res.status(StatusCodes.OK).json({ msg: "Email verified successfully" });
}

async function resendVerification(req, res) {
  const { email } = req.body;

  const user = await User.findOne({ email });

  // Always return the same response so we don't leak which emails exist
  const genericResponse = {
    msg: "If that account exists and is unverified, a new link has been sent.",
  };

  if (!user) return res.status(StatusCodes.OK).json(genericResponse);
  if (user.isVerified) return res.status(StatusCodes.OK).json(genericResponse);

  const verificationToken = crypto.randomBytes(32).toString("hex");
  user.verificationToken = verificationToken;
  user.verificationTokenExpires = Date.now() + 3600000;
  await user.save();

  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: "Verify your email",
      html: getRegisterEmailHtml(verificationUrl),
    });
  } catch (err) {
    throw createError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Could not send verification email. Please try again.",
    );
  }

  res.status(StatusCodes.OK).json(genericResponse);
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    throw createError(
      StatusCodes.BAD_REQUEST,
      "Please provide email and password",
    );
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw createError(StatusCodes.UNAUTHORIZED, "Invalid Credentials");
  }

  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    throw createError(StatusCodes.UNAUTHORIZED, "Invalid Credentials");
  }

  if (!user.isVerified) {
    throw createError(
      StatusCodes.FORBIDDEN,
      "Please verify your email first before logging in",
    );
  }

  const accessToken = user.createJWT();
  const refreshToken = user.createRefreshToken();

  user.refreshToken = refreshToken;
  await user.save();

  res.cookie("refreshToken", refreshToken, cookieOptions);

  res.status(StatusCodes.OK).json({
    msg: "Login successful!",
    accessToken,
    user: { email: user.email },
  });
}

async function refreshToken(req, res) {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    throw createError(StatusCodes.UNAUTHORIZED, "Refresh token required");
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(payload.userId);

    if (!user || user.refreshToken !== refreshToken) {
      throw createError(StatusCodes.UNAUTHORIZED, "Invalid refresh token");
    }

    // Generate new access token
    const newAccessToken = user.createJWT();

    // Optional: rotate refresh token
    const newRefreshToken = user.createRefreshToken();
    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(StatusCodes.OK).json({
      accessToken: newAccessToken,
    });
  } catch (error) {
    throw createError(
      StatusCodes.UNAUTHORIZED,
      "Invalid or expired refresh token",
    );
  }
}

async function logout(req, res) {
  const token = req.cookies?.refreshToken;
  const user = token
    ? await User.findOne({ refreshToken: token })
    : req.user?.userId
      ? await User.findById(req.user.userId)
      : null;

  if (user) {
    user.refreshToken = null;
    await user.save();
  }

  res.clearCookie("refreshToken");
  res.status(StatusCodes.OK).json({ msg: "Logged out successfully" });
}

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  logout,
  refreshToken,
};
