const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a name"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Please provide an email"],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please provide a valid email",
    ],
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 6,
    select: false,
  },
  preferences: {
    workStartHour: {
      type: Number,
      default: 9,
      min: 0,
      max: 23,
    },
    workEndHour: {
      type: Number,
      default: 17,
      min: 0,
      max: 23,
    },
    breakDuration: {
      type: Number,
      default: 15,
      min: 5,
      max: 60,
    },
    lunchBreak: {
      start: { type: Number, default: 12, min: 0, max: 23 },
      duration: { type: Number, default: 60, min: 15, max: 120 },
    },
    maxTasksPerDay: {
      type: Number,
      default: 10,
      min: 1,
      max: 30,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
