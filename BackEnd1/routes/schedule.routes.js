const express = require("express");
const {
  generateSchedule,
  getSchedule,
  completeTask,
  getWeekSchedule,
} = require("../controllers/schedule.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect);

router.post("/generate", generateSchedule);
router.get("/week/:date", getWeekSchedule);
router.get("/:date", getSchedule);
router.put("/:scheduleId/complete/:taskId", completeTask);

module.exports = router;
