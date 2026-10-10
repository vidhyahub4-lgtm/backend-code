const attendanceService = require("../services/attendanceservice");

// POST /api/attendance/mark
// body: { session, class, section, date, records: [{ student, status, remark }] }
async function markAttendance(req, res) {
  try {
    const { session, class: cls, section, date, records } = req.body;
    const schId = req.user?.schId || req.body.schId;
    const teacherId = req.body.teacherId;

    if (
      !session ||
      !cls ||
      !section ||
      !date ||
      !teacherId ||
      !Array.isArray(records) ||
      records.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "session, class, section, date, teacherId and records[] are required",
      });
    }

    const actor = {
      id: req.user._id,
      name: [req.user.firstname, req.user.lastname]
        .filter(Boolean)
        .join(" ")
        .trim(),
      role: req.user.userType || "",
    };
    const reason =
      typeof req.body.reason === "string"
        ? req.body.reason.trim().slice(0, 300)
        : "";

    const result = await attendanceService.markAttendance({
      schId,
      session,
      class: cls,
      section,
      date,
      records,
      teacherId,
      actor,
      reason,
    });

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  }
}

// GET /api/attendance?session=&class=&section=&date=
async function getAttendanceByDate(req, res) {
  try {
    const { session, class: cls, section, date } = req.query;
    const schId = req.user?.schId || req.query.schId;

    const records = await attendanceService.getAttendanceByDate({
      schId,
      session,
      class: cls,
      section,
      date,
    });

    return res.status(200).json({ success: true, data: records });
  } catch (err) {
    return res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  }
}

// GET /api/attendance/logs?schId=&session=&class=&section=&date=&student=&page=&limit=
async function getAttendanceLogs(req, res) {
  try {
    const schId = req.user?.schId || req.query.schId;
    const result = await attendanceService.getAttendanceLogs({ ...req.query, schId });
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

module.exports = { markAttendance, getAttendanceByDate, getAttendanceLogs };
