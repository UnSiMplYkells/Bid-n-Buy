const Auction = require("../models/Auction");
const { StatusCodes } = require("http-status-codes");
const createError = require("http-errors");
const { getLatestBids } = require("../services/auctionService");
const cloudinary = require("../services/cloudinary");

async function createAuction(req, res) {
  req.body.createdBy = req.user.userId;
  const auction = await Auction.create(req.body);
  res.status(StatusCodes.CREATED).json({
    msg: "Auction created successfully!",
    auction,
  });
}

async function getAllAuction(req, res) {
  const { status, name } = req.query;
  const queryObject = {};

  if (status) {
    queryObject.status = status;
  }

  if (name) {
    queryObject.name = { $regex: name, $options: "i" };
  }

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const auctions = await Auction.find(queryObject)
    .sort("-createdAt")
    .skip(skip)
    .limit(limit)
    .lean();

  const auctionIds = auctions.map((auction) => auction._id);

  const latestBids = await getLatestBids(auctionIds);

  const auctionsData = auctions.map((auction) => {
    const latestBid = latestBids.find(
      (bid) => bid.auction.toString() === auction._id.toString(),
    );

    return {
      ...auction,
      latestBid: latestBid || null, // Will be null if no one has bid yet
    };
  });

  res.status(StatusCodes.OK).json({
    msg: "All auctions retrieved successfully!",
    auctions: auctionsData,
    count: auctionsData.length,
    page,
    limit,
  });
}

async function getUserAuction(req, res) {
  const { status, name } = req.query;
  const queryObject = {};

  if (status) {
    queryObject.status = status;
  }

  if (name) {
    queryObject.name = { $regex: name, $options: "i" };
  }

  const auctions = await Auction.find({
    createdBy: req.user.userId,
    ...queryObject,
  }).sort("createdAt");

  res.status(StatusCodes.OK).json({
    msg: "User auctions retrieved successfully!",
    auctions,
    count: auctions.length,
  });
}

async function getAuctionDetails(req, res) {
  const { id: auctionId } = req.params;

  const auction = await Auction.findById(auctionId);

  if (!auction) {
    throw createError(StatusCodes.NOT_FOUND, `No auction with id ${auctionId}`);
  }

  const latestBidsArray = await getLatestBids([auctionId]);

  const latestBid = latestBidsArray.length > 0 ? latestBidsArray[0] : null;

  res.status(StatusCodes.OK).json({
    msg: "Auction details retrieved successfully!",
    auction,
    latestBid,
  });
}

async function editAuction(req, res) {
  const {
    body: { image, desc, name, askingPrice },
    user: { userId },
    params: { id: auctionId },
  } = req;

  const auction = await Auction.findOne({
    _id: auctionId,
    createdBy: userId,
  });

  if (!auction) {
    throw createError(
      StatusCodes.NOT_FOUND,
      `No auction with id ${auctionId} found for this user`,
    );
  }

  if (auction.status !== "active") {
    throw createError(
      StatusCodes.BAD_REQUEST,
      "You cannot edit an auction that has already closed.",
    );
  }

  if (auction.currentPrice > auction.askingPrice && askingPrice) {
    throw createError(
      StatusCodes.BAD_REQUEST,
      "You cannot change the starting price after bids have been placed.",
    );
  }

  const allowedUpdates = {};
  if (name) allowedUpdates.name = name;
  if (desc) allowedUpdates.desc = desc;
  if (image) allowedUpdates.image = image;

  // Only update askingPrice if no bids are placed
  if (
    !auction.highestBidder &&
    askingPrice &&
    auction.currentPrice === auction.askingPrice
  ) {
    allowedUpdates.askingPrice = askingPrice;
    // Keep the current price synced with the new asking price
    allowedUpdates.currentPrice = askingPrice;
  }

  const updatedAuction = await Auction.findByIdAndUpdate(
    auctionId,
    allowedUpdates,
    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  res.status(StatusCodes.OK).json({
    msg: "Auction details updated successfully!",
    auction: updatedAuction,
  });
}

async function deleteAuction(req, res) {
  const {
    user: { userId },
    params: { id: auctionId },
  } = req;

  const auction = await Auction.findOneAndDelete({
    _id: auctionId,
    status: "closed",
    createdBy: userId,
  });

  if (!auction) {
    const existing = await Auction.findOne({
      _id: auctionId,
      createdBy: userId,
    });

    if (!existing) {
      throw createError(
        StatusCodes.NOT_FOUND,
        `No auction with id ${auctionId}`,
      );
    }

    throw createError(
      StatusCodes.BAD_REQUEST,
      `Cannot delete an active auction`,
    );
  }

  res.status(StatusCodes.OK).json({ msg: "Deleted!" });
}

async function closeAuction(req, res) {
  const {
    user: { userId },
    params: { id: auctionId },
  } = req;

  const auction = await Auction.findOne({
    _id: auctionId,
    createdBy: userId,
  });

  if (!auction) {
    throw createError(
      StatusCodes.NOT_FOUND,
      `No auction with id ${auctionId} found for this user`,
    );
  }

  if (auction.status !== "active") {
    throw createError(StatusCodes.BAD_REQUEST, "Auction already closed");
  }

  const closeAuction = await Auction.findByIdAndUpdate(
    auctionId,
    { status: "closed" },
    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  res.status(StatusCodes.OK).json({
    msg: "Auction closed successfully!",
    auction: closeAuction,
  });
}

async function uploadImage(req, res) {
  const {
    user: { userId },
    params: { id: auctionId },
  } = req;

  if (!req.file) {
    throw createError(StatusCodes.BAD_REQUEST, "No image uploaded");
  }

  let cloudinaryResult;

  try {
    // Upload from RAM to Cloudinary
    cloudinaryResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "auction_images" },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );
      stream.end(req.file.buffer);
    });

    // Update the Database
    const auction = await Auction.findByIdAndUpdate(
      { _id: auctionId, createdBy: userId, status: "active" },
      { image: cloudinaryResult.secure_url },
      { returnDocument: "after" },
    );

    if (!auction) {
      throw createError(StatusCodes.NOT_FOUND, "Auction not found in database");
    }

    // Send Success Response
    res.status(StatusCodes.OK).json({
      msg: "Image uploaded successfully!",
      auction,
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

// for more than one image
// async function uploadImages(req, res) {
//   // 1. Validation: Check for files and enforce the minimum of 5
//   if (!req.files || req.files.length < 5) {
//     throw createError(
//       StatusCodes.BAD_REQUEST,
//       "Please upload at least 5 images",
//     );
//   }

//   let cloudinaryResults = [];

//   try {
//     // 2. Map over the files and upload concurrently
//     const uploadPromises = req.files.map((file) => {
//       return new Promise((resolve, reject) => {
//         const stream = cloudinary.uploader.upload_stream(
//           { folder: "auction_images" },
//           (error, result) => {
//             if (error) return reject(error);
//             resolve(result);
//           },
//         );
//         stream.end(file.buffer);
//       });
//     });

//     // Wait for all uploads to finish
//     cloudinaryResults = await Promise.all(uploadPromises);

//     // 3. Extract just the secure URLs for the database
//     const imageUrls = cloudinaryResults.map((result) => result.secure_url);

//     // 4. Update Database
//     const auction = await Auction.findByIdAndUpdate(
//       req.params.id,
//       { images: imageUrls },
//       { new: true, runValidators: true },
//     );

//     if (!auction) {
//       throw createError(StatusCodes.NOT_FOUND, "Auction not found");
//     }

//     res.status(StatusCodes.OK).json({
//       msg: "Images uploaded successfully!",
//       auction,
//     });
//   } catch (error) {
//     // 5. Multi-Image Rollback
//     // If anything fails, destroy ALL images that made it to Cloudinary
//     if (cloudinaryResults.length > 0) {
//       const deletePromises = cloudinaryResults.map((result) =>
//         cloudinary.uploader.destroy(result.public_id).catch(console.error),
//       );
//       await Promise.all(deletePromises);
//     }
//     throw error;
//   }
// }

module.exports = {
  createAuction,
  getAllAuction,
  getUserAuction,
  getAuctionDetails,
  editAuction,
  deleteAuction,
  closeAuction,
  uploadImage,
};
