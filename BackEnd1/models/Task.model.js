const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: [true, "Please provide a task title"],
    trim: true,
    maxlength: [100, "Title cannot exceed 100 characters"],
  },
  description: {
    type: String,
    maxlength: [500, "Description cannot exceed 500 characters"],
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium",
  },
  estimatedDuration: {
    type: Number,
    required: [true, "Please provide estimated duration"],
    min: [5, "Duration must be at least 5 minutes"],
    max: [480, "Duration cannot exceed 8 hours"],
  },
  dueDate: {
    type: Date,
  },
  isFlexible: {
    type: Boolean,
    default: true,
  },
  preferredTimeOfDay: {
    type: String,
    enum: ["morning", "afternoon", "evening", "any"],
    default: "any",
  },
  status: {
    type: String,
    enum: ["pending", "scheduled", "completed", "missed"],
    default: "pending",
  },
  scheduledStart: Date,
  scheduledEnd: Date,
  completedAt: Date,
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

TaskSchema.index({ user: 1, status: 1, dueDate: 1 });

module.exports = mongoose.model("Task", TaskSchema);
