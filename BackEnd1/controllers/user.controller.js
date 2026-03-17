const User = require("../models/User.model");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

exports.updatePreferences = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { preferences: req.body },
    { new: true, runValidators: true },
  );
  res.status(200).json({
    success: true,
    data: user.preferences,
  });
});

exports.getPreferences = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    data: user.preferences,
  });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name, email },
    { new: true, runValidators: true },
  );
  res.status(200).json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      preferences: user.preferences,
    },
  });
});
