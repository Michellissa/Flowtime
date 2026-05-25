import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.model";
import { AppError } from "../utils/AppError";
import asyncHandler from "../utils/asyncHandler";
import { AuthRequest } from "../types/express";

export const protect = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    return next(new AppError("Not authorized to access this route", 401));
  }
});
