const { Router } = require("express");
const {
  getFlowtime,
  saveFlowtime,
  updateFlowtime,
  deleteFlowtime,
} = require("../controllers/Flowtime.controller");

const router = Router();

router.get("/", getFlowtime);
router.post("/save", saveFlowtime);
router.put("/update", updateFlowtime);
router.delete("/delete", deleteFlowtime);

module.exports = router;
