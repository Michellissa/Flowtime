import { Response } from "express";
import User from "../models/User.model";
import asyncHandler from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { AuthRequest } from "../types/express";

export const updatePreferences = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findByIdAndUpdate(
    req.user!.id,
    { preferences: req.body },
    { new: true, runValidators: true },
  );
  res.status(200).json({
    success: true,
    data: user!.preferences,
  });
});

export const getPreferences = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.id);
  res.status(200).json({
    success: true,
    data: user!.preferences,
  });
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user!.id,
    { name, email },
    { new: true, runValidators: true },
  );
  res.status(200).json({
    success: true,
    data: {
      id: user!._id,
      name: user!.name,
      email: user!.email,
      preferences: user!.preferences,
    },
  });
});
