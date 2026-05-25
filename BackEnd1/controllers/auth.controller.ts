import { Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.model";
import asyncHandler from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { AuthRequest } from "../types/express";

const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRE as string,
  } as jwt.SignOptions);
};

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email, password } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("Email already registered", 400);
  }
  const user = await User.create({ name, email, password });
  const token = generateToken(user._id.toString());
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

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new AppError("Invalid credentials", 401);
  }
  const token = generateToken(user._id.toString());
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

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.id);
  res.status(200).json({
    success: true,
    user: {
      id: user!._id,
      name: user!.name,
      email: user!.email,
      preferences: user!.preferences,
    },
  });
});
