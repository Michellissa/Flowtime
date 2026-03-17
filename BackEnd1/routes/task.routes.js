const express = require("express");
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats,
} = require("../controllers/task.controller");
const { protect } = require("../middleware/auth.middleware");
const { validateTask } = require("../middleware/validation.middleware");

const router = express.Router();

router.use(protect);

router.route("/").get(getTasks).post(validateTask, createTask);
router.get("/stats/overview", getTaskStats);
router
  .route("/:id")
  .get(getTask)
  .put(validateTask, updateTask)
  .delete(deleteTask);

module.exports = router;
