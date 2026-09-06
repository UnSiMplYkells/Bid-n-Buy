const { StatusCodes } = require("http-status-codes");
const {
  getUserProfile,
  getUserCurrentBids,
  getUserWins,
} = require("../services/userService");
const User = require("../models/User");

async function createUserProfile(req, res) {
  const { body: {username, image, phoneNumber} } = req;

  const profile = await User.findOneAndUpdate(
      { email: req.user.email }, 
      { username, image, phoneNumber }, 
      { new: true, runValidators: true, select: '-password -__v' }
    );

  res.status(StatusCodes.CREATED).json(
    { 
      msg: "User profile updated successfully!", 
      profile
    });
}

async function currentBids(req, res) {
  const userCurrentBids = await getUserCurrentBids(req.user.userId);

  res.json({
    msg: "User current bids retrieved successfully!",
    userCurrentBids,
  });
}

async function wonBids(req, res) {
  const userWins = await getUserWins(req.user.userId);

  res.json({
    msg: "User won bids retrieved successfully!",
    userWins,
  });
}

async function me(req, res) {
  const [userProfile, userCurrentBids, userWins] = await Promise.all([
    getUserProfile(req.user.userId),
    getUserCurrentBids(req.user.userId),
    getUserWins(req.user.userId),
  ]);

  res.status(StatusCodes.OK).json({
    msg: "User details retrieved successfully!",
    userProfile,
    userCurrentBids,
    userWins,
  });
}
module.exports = {
  me,
  currentBids,
  wonBids,
  createUserProfile,
};
