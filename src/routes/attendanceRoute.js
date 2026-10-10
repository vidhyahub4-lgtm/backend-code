const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendancecontroller");
const authMiddleware = require("../middileware/auth");
// const { authenticate } = require("../middleware/auth");

// router.use(authenticate);

router.post("/mark", authMiddleware, attendanceController.markAttendance);
router.get("/logs", authMiddleware, attendanceController.getAttendanceLogs);
router.get("/", authMiddleware, attendanceController.getAttendanceByDate);

module.exports = router;