import Schedule from "../models/Schedule.model";
import Task from "../models/Task.model";
import User from "../models/User.model";
import { Scheduler, ScheduleResult } from "../utils/scheduler";
import { AppError } from "../utils/AppError";

export const generateSchedule = async (userId: string, dateStr: string | undefined) => {
  const scheduleDate = dateStr ? new Date(dateStr) : new Date();
  scheduleDate.setHours(0, 0, 0, 0);
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  await Task.updateMany(
    { user: userId, status: "scheduled" },
    { status: "pending", $unset: { scheduledStart: "", scheduledEnd: "" } },
  );
  const tasks = await Task.find({
    user: userId,
    status: { $in: ["pending", "scheduled"] },
  }).sort({ priority: -1, dueDate: 1 });
  if (tasks.length === 0) {
    throw new AppError("No tasks to schedule", 400);
  }
  const scheduler = new Scheduler(user.preferences);
  const scheduleResult = scheduler.scheduleTasks(tasks, scheduleDate);
  await Schedule.findOneAndUpdate(
    { user: userId, date: scheduleDate },
    {
      user: userId,
      date: scheduleDate,
      blocks: scheduleResult.blocks,
      totalAvailableMinutes: scheduleResult.stats.totalAvailableMinutes,
      totalScheduledMinutes: scheduleResult.stats.totalScheduledMinutes,
      totalBreakMinutes: scheduleResult.stats.totalBreakMinutes,
      productivityScore: scheduleResult.stats.productivityScore,
    },
    { upsert: true, new: true },
  );
  for (const task of scheduleResult.scheduledTasks) {
    await Task.findByIdAndUpdate(task._id, {
      status: "scheduled",
      scheduledStart: task.scheduledStart,
      scheduledEnd: task.scheduledEnd,
    });
  }
  return scheduleResult;
};

export const getScheduleByDate = async (userId: string, dateStr: string) => {
  const scheduleDate = new Date(dateStr);
  scheduleDate.setHours(0, 0, 0, 0);
  return Schedule.findOne({
    user: userId,
    date: scheduleDate,
  }).populate("blocks.task", "title priority estimatedDuration");
};

export const completeTaskInSchedule = async (userId: string, scheduleId: string, taskId: string) => {
  const task = await Task.findOneAndUpdate(
    { _id: taskId, user: userId },
    { status: "completed", completedAt: Date.now() },
    { new: true },
  );
  if (!task) {
    throw new AppError("Task not found", 404);
  }
  const schedule = await Schedule.findById(scheduleId);
  if (schedule) {
    const block = schedule.blocks.find((b) => b.task?.toString() === taskId);
    if (block) {
      await schedule.save();
    }
  }
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  const remainingTasks = await Task.find({
    user: userId,
    status: "scheduled",
    _id: { $ne: taskId },
  });
  if (remainingTasks.length > 0 && schedule) {
    const scheduler = new Scheduler(user.preferences);
    const newSchedule = scheduler.scheduleTasks(
      remainingTasks,
      new Date(schedule.date),
    );
    await Schedule.findByIdAndUpdate(scheduleId, {
      blocks: newSchedule.blocks,
      totalScheduledMinutes: newSchedule.stats.totalScheduledMinutes,
      productivityScore: newSchedule.stats.productivityScore,
    });
  }
};

export const getWeekSchedule = async (userId: string, dateStr: string) => {
  const startDate = new Date(dateStr);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);
  return Schedule.find({
    user: userId,
    date: { $gte: startDate, $lt: endDate },
  }).sort({ date: 1 });
};
