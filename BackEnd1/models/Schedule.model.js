const mongoose = require("mongoose");

const ScheduleSchema = new mongoose.Schema({
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

module.exports = mongoose.model("Schedule", ScheduleSchema);
