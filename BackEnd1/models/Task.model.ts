import mongoose, { Document, Schema, Model } from "mongoose";

export type Priority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "pending" | "scheduled" | "completed" | "missed";
export type PreferredTime = "morning" | "afternoon" | "evening" | "any";

export interface ITask extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  priority: Priority;
  estimatedDuration: number;
  dueDate?: Date;
  isFlexible: boolean;
  preferredTimeOfDay: PreferredTime;
  status: TaskStatus;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  completedAt?: Date;
  tags: string[];
  createdAt: Date;
}

const TaskSchema = new Schema<ITask>({
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

const Task: Model<ITask> = mongoose.model<ITask>("Task", TaskSchema);
export default Task;
