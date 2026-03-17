const User = require("../models/User.model");
const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("Email already registered", 400);
  }
  const user = await User.create({ name, email, password });
  const token = generateToken(user._id);
  res.status(201).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      preferences: user.preferences,
    },
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new AppError("Invalid credentials", 401);
  }
  const token = generateToken(user._id);
  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      preferences: user.preferences,
    },
  });
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      preferences: user.preferences,
    },
  });
});
