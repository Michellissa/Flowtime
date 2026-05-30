import Task from "../models/Task.model";
import Schedule from "../models/Schedule.model";
import { AppError } from "../utils/AppError";

export const fetchTasks = async (userId: string, filters: { status?: string; priority?: string; dueDate?: string }) => {
  const query: Record<string, any> = { user: userId };
  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;
  if (filters.dueDate) {
    const date = new Date(filters.dueDate);
    query.dueDate = {
      $gte: date,
      $lt: new Date(date.setDate(date.getDate() + 1)),
    };
  }
  return Task.find(query).sort({
    dueDate: 1,
    priority: -1,
    createdAt: -1,
  });
};

export const fetchTask = async (userId: string, taskId: string) => {
  const task = await Task.findOne({ _id: taskId, user: userId });
  if (!task) {
    throw new AppError("Task not found", 404);
  }
  return task;
};

export const createTask = async (userId: string, data: Record<string, any>) => {
  data.user = userId;
  return Task.create(data);
};

export const updateTask = async (userId: string, taskId: string, data: Record<string, any>) => {
  let task = await Task.findOne({ _id: taskId, user: userId });
  if (!task) {
    throw new AppError("Task not found", 404);
  }
  if (data.status === "completed" && task.status !== "completed") {
    data.completedAt = Date.now();
  }
  return Task.findByIdAndUpdate(taskId, data, { new: true, runValidators: true });
};

export const deleteTask = async (userId: string, taskId: string) => {
  const task = await Task.findOneAndDelete({ _id: taskId, user: userId });
  if (!task) {
    throw new AppError("Task not found", 404);
  }
  await Schedule.updateMany(
    { user: userId },
    { $pull: { blocks: { task: taskId } } },
  );
  return task;
};

export const fetchTaskStats = async (userId: string) => {
  const stats = await Task.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalDuration: { $sum: "$estimatedDuration" },
      },
    },
  ]);
  const totalTasks = await Task.countDocuments({ user: userId });
  const completedTasks = await Task.countDocuments({
    user: userId,
    status: "completed",
  });
  return {
    byStatus: stats,
    totalTasks,
    completedTasks,
    completionRate: totalTasks
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0,
  };
};
