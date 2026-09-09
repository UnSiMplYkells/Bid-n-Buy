const { StatusCodes } = require("http-status-codes");
const {
  getUserProfile,
  getUserCurrentBids,
  getUserWins,
} = require("../services/userService");
const User = require("../models/User");
const cloudinary = require("../services/cloudinary");
const createError = require("http-errors");

async function createUserProfile(req, res) {
  const { body: {username, image, phoneNumber} } = req;

  const profile = await User.findOneAndUpdate(
      { email: req.user.email }, 
      { username, image, phoneNumber }, 
      { returnDocument: 'after', runValidators: true, select: '-password -__v' }
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

async function uploadImage(req, res) {
  if (req.params.id !== req.user.userId) {
    throw createError(
      StatusCodes.FORBIDDEN,
      "Not authorized to update this profile",
    );
  }

  if (!req.file) {
    throw createError(StatusCodes.BAD_REQUEST, "No image uploaded");
  }

  let cloudinaryResult;

  try {
    cloudinaryResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "user_profiles" }, // Keeps your Cloudinary dashboard clean
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );
      stream.end(req.file.buffer);
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { image: cloudinaryResult.secure_url },
      { returnDocument: "after", runValidators: true, select: "-password -__v" },
    );

    res.status(StatusCodes.OK).json({
      msg: "Profile picture updated successfully!",
      user: updatedUser,
    });
  } catch (error) {
    if (cloudinaryResult && cloudinaryResult.public_id) {
      cloudinary.uploader
        .destroy(cloudinaryResult.public_id)
        .catch(console.error);
    }
    throw error; 
}
}

async function deleteImage(req, res) {
  if (req.params.id !== req.user.userId) {
    throw createError(
      StatusCodes.FORBIDDEN,
      "Not authorized to modify this profile",
    );
  }

  const user = await User.findById(req.user.userId);
  const defaultImage =
    "https://tse1.explicit.bing.net/th/id/OIP.nNcZCmS6bYcpZXN7AimcNwHaGI?r=0&rs=1&pid=ImgDetMain&o=7&rm=3";

  if (user.image === defaultImage) {
    throw createError(
      StatusCodes.BAD_REQUEST,
      "User already has the default profile picture",
    );
  }

  // Extract the Cloudinary public_id from the user's current image URL
  const urlParts = user.image.split("/");
  const filename = urlParts.pop().split(".")[0];
  const folder = urlParts.pop();
  const publicId = `${folder}/${filename}`;

  // Delete the image from Cloudinary
  await cloudinary.uploader.destroy(publicId);

  // Reset the user's image back to the default
  user.image = defaultImage;
  await user.save();

  // Return the user without the password field
  const userResponse = await User.findById(req.user.userId).select(
    "-password -__v",
  );

  res.status(StatusCodes.OK).json({
    msg: "Profile picture removed successfully!",
    user: userResponse,
  });
}

module.exports = {
  me,
  currentBids,
  wonBids,
  createUserProfile,
  uploadImage,
  deleteImage
}
