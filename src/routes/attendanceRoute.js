const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendancecontroller");
// const { authenticate } = require("../middleware/auth");

// router.use(authenticate);

router.post("/mark", attendanceController.markAttendance);
router.get("/", attendanceController.getAttendanceByDate);

module.exports = router;