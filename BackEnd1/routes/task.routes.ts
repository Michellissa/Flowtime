import express from "express";
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats,
} from "../controllers/task.controller";
import { protect } from "../middleware/auth.middleware";
import { validateTask } from "../middleware/validation.middleware";

const router = express.Router();

router.use(protect);

router.route("/").get(getTasks).post(validateTask, createTask);
router.get("/stats/overview", getTaskStats);
router
  .route("/:id")
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

export default router;
