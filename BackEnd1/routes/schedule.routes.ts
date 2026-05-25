import express from "express";
import {
  generateSchedule,
  getSchedule,
  completeTask,
  getWeekSchedule,
} from "../controllers/schedule.controller";
import { protect } from "../middleware/auth.middleware";

const router = express.Router();

router.use(protect);

router.post("/generate", generateSchedule);
router.get("/week/:date", getWeekSchedule);
router.get("/:date", getSchedule);
router.put("/:scheduleId/complete/:taskId", completeTask);

export default router;
