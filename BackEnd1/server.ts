import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import authRoutes from "./routes/auth.routes";
import taskRoutes from "./routes/task.routes";
import scheduleRoutes from "./routes/schedule.routes";
import errorHandler from "./middleware/error.middleware";
import { AppError } from "./utils/AppError";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

const connectDB = async () => {
  try {
    console.log("Attempting to connect to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGODB_URL as string, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ Connected to MongoDB Atlas");
  } catch (err: any) {
    console.error("❌ MongoDB connection error:");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);

    if (err.name === "MongoServerError" && err.code === 18) {
      console.error("🔐 Authentication failed - check username/password");
    }
    if (err.message.includes("whitelist")) {
      console.error("🔒 IP not whitelisted - add your IP in MongoDB Atlas");
    }
    if (err.name === "MongooseServerSelectionError") {
      console.error("🌐 Cannot reach MongoDB Atlas - check network/whitelist");
    }

    process.exit(1);
  }
};

connectDB();

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/schedule", scheduleRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errorHandler);

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

export default app;
