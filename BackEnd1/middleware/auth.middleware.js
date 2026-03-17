const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

exports.protect = asyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(new AppError("Not authorized to access this route", 401));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    return next(new AppError("Not authorized to access this route", 401));
  }
});
