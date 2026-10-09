const Attendance = require("../models/teacher/attendance");
const ClassTeacherAssignment = require("../models/teacher/classteacherassign");
const StudentEnrollment = require("../models/school-setting/Studentenrollment");

const { STATUSES } = Attendance;

/** Confirms `teacherId` is the class teacher of class-section for this session */
async function assertIsClassTeacher({ schId, session, class: cls, section, teacherId }) {
  const assignment = await ClassTeacherAssignment.findOne({
    schId,
    session,
    class: cls,
    section,
  });

  if (!assignment) {
    const err = new Error("No class teacher assigned for this class-section yet");
    err.status = 400;
    throw err;
  }

  if (String(assignment.teacher) !== String(teacherId)) {
    const err = new Error("Only the class teacher of this class-section can mark attendance");
    err.status = 403;
    throw err;
  }

  return assignment;
}

function startOfDay(date) {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
}

/**
 * Mark attendance for a whole class-section on a date in ONE write.
 * records: [{ student, status, remark }]  (student = StudentEnrollment _id)
 * The list REPLACES that day's records, so send every student of the class.
 */
async function markAttendance({ schId, session, class: cls, section, date, records, teacherId }) {
  await assertIsClassTeacher({ schId, session, class: cls, section, teacherId });

  // Validate and de-duplicate by student (the last entry for a student wins).
  const byStudent = new Map();
  for (const r of records) {
    if (!r || !r.student || !STATUSES.includes(r.status)) {
      const err = new Error(`Each record needs a student and a status (${STATUSES.join(", ")})`);
      err.status = 400;
      throw err;
    }
    byStudent.set(String(r.student), {
      student: r.student,
      status: r.status,
      remark: r.remark || "",
    });
  }
  const enrollments = await StudentEnrollment.find({ _id: { $in: [...byStudent.keys()] } })
    .select("rollNo")
    .lean();
  const rollMap = new Map(enrollments.map((e) => [String(e._id), e.rollNo ?? 0]));
  const cleaned = [...byStudent.values()].map((r) => ({
    ...r,
    rollNo: rollMap.get(String(r.student)) ?? 0,
  }));

  const day = startOfDay(date);

  await Attendance.findOneAndUpdate(
    { schId, session, class: cls, section, date: day },
    { $set: { records: cleaned, markedBy: teacherId } },
    { upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  return { date: day, total: cleaned.length };
}

/**
 * Returns a flat list ({ _id, student, status, remark }), one entry per
 * student, so callers don't need to know about the one-document-per-day layout.
 */
async function getAttendanceByDate({ schId, session, class: cls, section, date }) {
  const doc = await Attendance.findOne({
    schId,
    session,
    class: cls,
    section,
    date: startOfDay(date),
  }).populate({
    path: "records.student",
    select: "rollNo studentId",
    populate: {
      path: "studentId",
      select: "admno regno",
      populate: { path: "regno", select: "sname" },
    },
  });

  if (!doc) return [];

  return doc.records.map((r) => ({
    _id: String(r.student?._id ?? r.student),
    student: r.student,
    status: r.status,
    remark: r.remark,
    rollNo: r.rollNo,
  }));
}

module.exports = { markAttendance, getAttendanceByDate, assertIsClassTeacher };