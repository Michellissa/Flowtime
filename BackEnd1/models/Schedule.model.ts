import mongoose, { Document, Schema, Model } from "mongoose";

export interface IScheduleBlock {
  task?: mongoose.Types.ObjectId;
  startTime?: Date;
  endTime?: Date;
  title?: string;
  isBreak: boolean;
  breakType?: "short" | "lunch" | null;
}

export interface ISchedule extends Document {
  user: mongoose.Types.ObjectId;
  date: Date;
  blocks: IScheduleBlock[];
  totalAvailableMinutes?: number;
  totalScheduledMinutes?: number;
  totalBreakMinutes?: number;
  productivityScore?: number;
  createdAt: Date;
}

const ScheduleSchema = new Schema<ISchedule>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  blocks: [
    {
      task: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
      startTime: Date,
      endTime: Date,
      title: String,
      isBreak: {
        type: Boolean,
        default: false,
      },
      breakType: {
        type: String,
        enum: ["short", "lunch", null],
        default: null,
      },
    },
  ],
  totalAvailableMinutes: Number,
  totalScheduledMinutes: Number,
  totalBreakMinutes: Number,
  productivityScore: {
    type: Number,
    min: 0,
    max: 100,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

ScheduleSchema.index({ user: 1, date: 1 }, { unique: true });

const Schedule: Model<ISchedule> = mongoose.model<ISchedule>("Schedule", ScheduleSchema);
export default Schedule;
