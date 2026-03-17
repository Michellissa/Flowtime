const Schedule = require("../models/Schedule.model");
const Task = require("../models/Task.model");
const User = require("../models/User.model");
const Scheduler = require("../utils/scheduler");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

exports.generateSchedule = asyncHandler(async (req, res) => {
  const { date } = req.body;
  const scheduleDate = date ? new Date(date) : new Date();
  scheduleDate.setHours(0, 0, 0, 0);
  const user = await User.findById(req.user.id);
  const tasks = await Task.find({
    user: req.user.id,
    status: { $in: ["pending", "scheduled"] },
  }).sort({ priority: -1, dueDate: 1 });
  if (tasks.length === 0) {
    throw new AppError("No tasks to schedule", 400);
  }
  const scheduler = new Scheduler(user.preferences);
  const scheduleResult = scheduler.scheduleTasks(tasks, scheduleDate);
  let schedule = await Schedule.findOneAndUpdate(
    { user: req.user.id, date: scheduleDate },
    {
      user: req.user.id,
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
  res.status(200).json({
    success: true,
    data: scheduleResult,
  });
});

exports.getSchedule = asyncHandler(async (req, res) => {
  const { date } = req.params;
  const scheduleDate = new Date(date);
  scheduleDate.setHours(0, 0, 0, 0);
  const schedule = await Schedule.findOne({
    user: req.user.id,
    date: scheduleDate,
  }).populate("blocks.task", "title priority estimatedDuration");
  if (!schedule) {
    return res.status(200).json({
      success: true,
      data: null,
      message: "No schedule found for this date",
    });
  }
  res.status(200).json({
    success: true,
    data: schedule,
  });
});

exports.completeTask = asyncHandler(async (req, res) => {
  const { scheduleId, taskId } = req.params;
  const task = await Task.findOneAndUpdate(
    { _id: taskId, user: req.user.id },
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
  const user = await User.findById(req.user.id);
  const remainingTasks = await Task.find({
    user: req.user.id,
    status: "scheduled",
    _id: { $ne: taskId },
  });
  if (remainingTasks.length > 0) {
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
  res.status(200).json({
    success: true,
    message: "Task completed and schedule updated",
  });
});

exports.getWeekSchedule = asyncHandler(async (req, res) => {
  const { date } = req.params;
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);
  const schedules = await Schedule.find({
    user: req.user.id,
    date: { $gte: startDate, $lt: endDate },
  }).sort({ date: 1 });
  res.status(200).json({
    success: true,
    count: schedules.length,
    data: schedules,
  });
});
