const attendanceService = require("../services/attendanceservice");

// POST /api/attendance/mark
// body: { session, class, section, date, records: [{ student, status, remark }] }
async function markAttendance(req, res) {
  try {
    const { session, class: cls, section, date, records } = req.body;
    const schId = req.user?.schId || req.body.schId;
    const teacherId = req.user?._id || req.body.teacherId; // from auth middleware in real setup

    if (!session || !cls || !section || !date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: "session, class, section, date and records[] are required",
      });
    }

    const result = await attendanceService.markAttendance({
      schId,
      session,
      class: cls,
      section,
      date,
      records,
      teacherId,
    });

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
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
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

module.exports = { markAttendance, getAttendanceByDate };