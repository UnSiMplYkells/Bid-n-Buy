const { StatusCodes } = require("http-status-codes");

const errorHandlerMiddleware = (err, req, res, next) => {
  console.error("API ERROR:", err);

  let statusCode =
    err.statusCode || err.status || StatusCodes.INTERNAL_SERVER_ERROR;
  let message = err.message || "Something went wrong. Try again later.";

  if (statusCode >= 500 && !err.expose) {
    message = "Something went wrong. Try again later.";
  }

  if (err.code === 11000) {
    statusCode = StatusCodes.BAD_REQUEST;
    const duplicateField = Object.keys(err.keyValue || {})[0] || "field";
    message = `Duplicate value entered for ${duplicateField} field, please choose another value`;
  }

  if (err.name === "CastError") {
    statusCode = StatusCodes.BAD_REQUEST;
    message = `No item found with id: ${err.value}`;
  }

  return res.status(statusCode).json({ msg: message });
};

module.exports = errorHandlerMiddleware;
