import { Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import { AuthRequest } from "../types/express";
import * as authService from "../services/auth.service";

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email, password } = req.body;
  const result = await authService.registerUser(name, email, password);
  res.status(201).json({ success: true, ...result });
});

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.loginUser(email, password);
  res.status(200).json({ success: true, ...result });
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await authService.getCurrentUser(req.user!.id);
  res.status(200).json({ success: true, user });
});
