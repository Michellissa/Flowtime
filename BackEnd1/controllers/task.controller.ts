import { Response } from "express";
import Task from "../models/Task.model";
import Schedule from "../models/Schedule.model";
import asyncHandler from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { AuthRequest } from "../types/express";

export const getTasks = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, priority, dueDate } = req.query;
  const query: Record<string, any> = { user: req.user!.id };
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (dueDate) {
    const date = new Date(dueDate as string);
    query.dueDate = {
      $gte: date,
      $lt: new Date(date.setDate(date.getDate() + 1)),
    };
  }
  const tasks = await Task.find(query).sort({
    dueDate: 1,
    priority: -1,
    createdAt: -1,
  });
  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks,
  });
});

export const getTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const task = await Task.findOne({ _id: req.params.id, user: req.user!.id });
  if (!task) {
    throw new AppError("Task not found", 404);
  }
  res.status(200).json({
    success: true,
    data: task,
  });
});

export const createTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  req.body.user = req.user!.id;
  const task = await Task.create(req.body);
  res.status(201).json({
    success: true,
    data: task,
  });
});

export const updateTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  let task = await Task.findOne({ _id: req.params.id, user: req.user!.id });
  if (!task) {
    throw new AppError("Task not found", 404);
  }
  if (req.body.status === "completed" && task.status !== "completed") {
    req.body.completedAt = Date.now();
  }
  task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    success: true,
    data: task,
  });
});

export const deleteTask = asyncHandler(async (req: AuthRequest, res: Response) => {
  const task = await Task.findOneAndDelete({
    _id: req.params.id,
    user: req.user!.id,
  });
  if (!task) {
    throw new AppError("Task not found", 404);
  }
  await Schedule.updateMany(
    { user: req.user!.id },
    { $pull: { blocks: { task: req.params.id } } },
  );
  res.status(200).json({
    success: true,
    message: "Task deleted successfully",
  });
});

export const getTaskStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await Task.aggregate([
    { $match: { user: req.user!._id } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalDuration: { $sum: "$estimatedDuration" },
      },
    },
  ]);
  const totalTasks = await Task.countDocuments({ user: req.user!._id });
  const completedTasks = await Task.countDocuments({
    user: req.user!._id,
    status: "completed",
  });
  res.status(200).json({
    success: true,
    data: {
      byStatus: stats,
      totalTasks,
      completedTasks,
      completionRate: totalTasks
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0,
    },
  });
});
