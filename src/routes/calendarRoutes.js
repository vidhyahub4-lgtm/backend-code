const express = require("express");
const router = express.Router();
const calendarController = require("../controllers/calendarController");
// const { authenticate } = require("../middleware/auth");

// router.use(authenticate);

router.post("/mark", calendarController.markDates);      // single section / whole class / whole school
router.get("/", calendarController.getCalendar);
router.delete("/dates", calendarController.removeDates); // same scope rules as /mark

module.exports = router;