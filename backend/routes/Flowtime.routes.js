const { Router } = require("express");
const { getFlowtime } = require("../controllers/Flowtime.controller");

const router = Router();

router.get("/", getFlowtime);
router.post("/", saveFlowtime); 

module.exports = router;
