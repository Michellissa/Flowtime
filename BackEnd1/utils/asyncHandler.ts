import { Request, Response, NextFunction } from "express";
import { AppError } from "./AppError";

type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<any>;

const asyncHandler = (fn: AsyncFn) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch((err: any) => {
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

export default asyncHandler;
