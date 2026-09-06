const jwt = require("jsonwebtoken");
const createError = require("http-errors");
const { StatusCodes } = require("http-status-codes");

const auth = async (req, res, next) => {
  // check header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    throw createError(StatusCodes.UNAUTHORIZED, "Authentication invalid");
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    // attach the user to the auction routes
    req.user = 
      { 
        userId: payload.userId, 
        email: payload.email 
      };
      
    next();
  } catch (error) {
    throw createError(StatusCodes.UNAUTHORIZED, "Authentication invalid");
  }
};

module.exports = auth;