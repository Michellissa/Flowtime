import mongoose, { Document, Schema, Model } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUserPreferences {
  workStartHour: number;
  workEndHour: number;
  breakDuration: number;
  lunchBreak: { start: number; duration: number };
  maxTasksPerDay: number;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  preferences: IUserPreferences;
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
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

UserSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);
export default User;
