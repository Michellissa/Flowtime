import { Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import { AuthRequest } from "../types/express";
import * as taskService from "../services/task.service";

export const getTasks = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, priority, dueDate } = req.query;
  const tasks = await taskService.fetchTasks(req.user!.id, {
    status: status as string,
    priority: priority as string,
    dueDate: dueDate as string,
  });
  res.status(200).json({ success: true, count: tasks.length, data: tasks });
});

export const getTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const task = await taskService.fetchTask(req.user!.id, req.params.id as string);
  res.status(200).json({ success: true, data: task });
});

export const createTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const task = await taskService.createTask(req.user!.id, req.body);
  res.status(201).json({ success: true, data: task });
});

export const updateTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const task = await taskService.updateTask(req.user!.id, req.params.id as string, req.body);
  res.status(200).json({ success: true, data: task });
});

export const deleteTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  await taskService.deleteTask(req.user!.id, req.params.id as string);
  res.status(200).json({ success: true, message: "Task deleted successfully" });
});

export const getTaskStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await taskService.fetchTaskStats(req.user!.id);
  res.status(200).json({ success: true, data: stats });
});
