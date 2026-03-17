const AppError = require("./AppError");
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    if (err.name === "ValidationError") {
      return next(new AppError(err.message, 400));
    }
    if (err.code === 11000) {
      return next(new AppError("Duplicate field value", 400));
    }
    if (err.name === "CastError") {
      return next(new AppError("Invalid ID format", 400));
    }
    next(err);
  });
};
module.exports = asyncHandler;