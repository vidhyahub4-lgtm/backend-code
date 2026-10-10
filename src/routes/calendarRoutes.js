const express = require("express");
const router = express.Router();
const calendarController = require("../controllers/calendarController");
const authMiddleware = require("../middileware/auth");
router.use(authMiddleware);

router.post("/mark", calendarController.markDates);      // single section / whole class / whole school
router.get("/", calendarController.getCalendar);
router.delete("/dates", calendarController.removeDates); // same scope rules as /mark

module.exports = router;