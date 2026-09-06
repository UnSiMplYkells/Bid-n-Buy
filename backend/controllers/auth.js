const { StatusCodes } = require("http-status-codes");
const createError = require("http-errors");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function register(req, res) {
  const user = await User.create({ ...req.body });

  const accessToken = user.createJWT();
  const refreshToken = user.createRefreshToken();

  // Save refresh token in DB
  user.refreshToken = refreshToken;
  await user.save();

  // Send refresh token as httpOnly cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  res.status(StatusCodes.CREATED).json({
    msg: "User created successfully!",
    user: { email: user.email },
    accessToken,
  });
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

  const accessToken = user.createJWT();
  const refreshToken = user.createRefreshToken();

  user.refreshToken = refreshToken;
  await user.save();

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.status(StatusCodes.OK).json({
    msg: "Login successful!",
    user: { email: user.email },
    accessToken,
  });
}

async function refreshToken(req, res) {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    throw createError(StatusCodes.UNAUTHORIZED, 'Refresh token required');
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(payload.userId);

    if (!user || user.refreshToken !== refreshToken) {
      throw createError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
    }

    // Generate new access token
    const newAccessToken = user.createJWT();

    // Optional: rotate refresh token
    const newRefreshToken = user.createRefreshToken();
    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(StatusCodes.OK).json({
      accessToken: newAccessToken,
    });
  } catch (error) {
    throw createError(StatusCodes.UNAUTHORIZED, 'Invalid or expired refresh token');
  }
}

async function logout(req, res) {
  const user = await User.findById(req.user.userId);
  if (user) {
    user.refreshToken = null;
    await user.save();
  }

  res.clearCookie("refreshToken");
  res.status(StatusCodes.OK).json({ msg: "Logged out successfully" });
}



module.exports = {
  register,
  login,
  logout,
  refreshToken,
};
