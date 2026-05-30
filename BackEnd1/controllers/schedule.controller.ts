import { Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { AuthRequest } from "../types/express";
import * as scheduleService from "../services/schedule.service";

export const generateSchedule = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { date } = req.body;
  const scheduleResult = await scheduleService.generateSchedule(req.user!.id, date);
  res.status(200).json({ success: true, data: scheduleResult });
});

export const getSchedule = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schedule = await scheduleService.getScheduleByDate(req.user!.id, req.params.date as string);
  if (!schedule) {
    return res.status(200).json({
      success: true,
      data: null,
      message: "No schedule found for this date",
    });
  }
  res.status(200).json({ success: true, data: schedule });
});

export const completeTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  await scheduleService.completeTaskInSchedule(req.user!.id, req.params.scheduleId as string, req.params.taskId as string);
  res.status(200).json({ success: true, message: "Task completed and schedule updated" });
});

export const getWeekSchedule = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schedules = await scheduleService.getWeekSchedule(req.user!.id, req.params.date as string);
  res.status(200).json({ success: true, count: schedules.length, data: schedules });
});
