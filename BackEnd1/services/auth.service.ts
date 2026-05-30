import jwt from "jsonwebtoken";
import User from "../models/User.model";
import { AppError } from "../utils/AppError";

const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRE as string,
  } as jwt.SignOptions);
};

export const registerUser = async (name: string, email: string, password: string) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("Email already registered", 400);
  }
  const user = await User.create({ name, email, password });
  const token = generateToken(user._id.toString());
  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      preferences: user.preferences,
    },
  };
};

export const loginUser = async (email: string, password: string) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new AppError("Invalid credentials", 401);
  }
  const token = generateToken(user._id.toString());
  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      preferences: user.preferences,
    },
  };
};

export const getCurrentUser = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    preferences: user.preferences,
  };
};
