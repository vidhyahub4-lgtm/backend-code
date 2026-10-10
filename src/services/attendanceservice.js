const Attendance = require("../models/teacher/attendance");
const mongoose = require("mongoose");
const AttendanceAuditLog = require("../models/teacher/attendanceAuditLog");
const ClassTeacherAssignment = require("../models/teacher/classteacherassign");
const StudentEnrollment = require("../models/school-setting/Studentenrollment");
const calendarService = require("./calendarService");
const { STATUSES } = Attendance;

const APP_TIME_ZONE = "Asia/Kolkata";
const YMD = /^\d{4}-\d{2}-\d{2}$/;

/** yyyy-mm-dd of `value` in IST. Returns "" if invalid. */
function toYMD(value) {
  if (typeof value === "string" && YMD.test(value.trim())) return value.trim();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA", { timeZone: APP_TIME_ZONE });
}

/** daysBack > 0 means a past date, < 0 means future. */
function classifyDate(date, now = new Date()) {
  const target = toYMD(date);
  if (!target) return null;
  const today = toYMD(now);
  const daysBack = Math.round((Date.parse(today) - Date.parse(target)) / 86400000);
  return { daysBack, isPast: daysBack > 0, isFuture: daysBack < 0 };
}

/** One entry per student whose status changed, was added or was removed. */
function diffRecords(oldRecords = [], newRecords = []) {
  const oldMap = new Map(oldRecords.map((r) => [String(r.student), r.status]));
  const newMap = new Map(newRecords.map((r) => [String(r.student), r.status]));
  const changes = [];
  for (const [student, newStatus] of newMap) {
    const oldStatus = oldMap.has(student) ? oldMap.get(student) : null;
    if (oldStatus !== newStatus) changes.push({ student, oldStatus, newStatus });
  }
  for (const [student, oldStatus] of oldMap) {
    if (!newMap.has(student)) changes.push({ student, oldStatus, newStatus: null });
  }
  return changes;
}

/** Confirms `teacherId` is the class teacher of class-section for this session */
async function assertIsClassTeacher({
  schId,
  session,
  class: cls,
  section,
  teacherId,
}) {
  const assignment = await ClassTeacherAssignment.findOne({
    schId,
    session,
    class: cls,
    section,
  });

  if (!assignment) {
    const err = new Error(
      "No class teacher assigned for this class-section yet",
    );
    err.status = 400;
    throw err;
  }

  if (String(assignment.teacher) !== String(teacherId)) {
    const err = new Error(
      "Only the class teacher of this class-section can mark attendance",
    );
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
async function markAttendance({
  schId,
  session,
  class: cls,
  section,
  date,
  records,
  teacherId,
  actor,
  reason = "",
}) {
  // Confirm the date is a working day for this class-section (not a holiday or weekly off)
  // const day = toDay(date);
  // await calendarService.assertWorkingDay({
  //   schId,
  //   session,
  //   clsid: cls,
  //   secid: section,
  //   date: day,
  // });
  await assertIsClassTeacher({
    schId,
    session,
    class: cls,
    section,
    teacherId,
  });

    const when = classifyDate(date);
  if (!when) {
    const err = new Error("date is invalid");
    err.status = 400;
    throw err;
  }
  if (when.isFuture) {
    const err = new Error("Attendance cannot be marked for a future date");
    err.status = 400;
    throw err;
  }

  // Validate and de-duplicate by student (the last entry for a student wins).
  const byStudent = new Map();
  for (const r of records) {
    if (!r || !r.student || !STATUSES.includes(r.status)) {
      const err = new Error(
        `Each record needs a student and a status (${STATUSES.join(", ")})`,
      );
      err.status = 400;
      throw err;
    }
    byStudent.set(String(r.student), {
      student: r.student,
      status: r.status,
      remark: r.remark || "",
    });
  }
  const enrollments = await StudentEnrollment.find({
    _id: { $in: [...byStudent.keys()] },
  })
    .select("rollNo")
    .lean();
  const rollMap = new Map(
    enrollments.map((e) => [String(e._id), e.rollNo ?? 0]),
  );
  const cleaned = [...byStudent.values()].map((r) => ({
    ...r,
    rollNo: rollMap.get(String(r.student)) ?? 0,
  }));

  const day = startOfDay(date);
  const filter = { schId, session, class: cls, section, date: day };
  const update = { $set: { records: cleaned, markedBy: teacherId } };
  const options = { upsert: true, runValidators: true, setDefaultsOnInsert: true };

  // Today: plain save, nothing to audit.
  if (!when.isPast) {
    await Attendance.findOneAndUpdate(filter, update, options);
    return { date: day, total: cleaned.length, logged: 0 };
  }

  // Past date: save + audit rows together or not at all.
  const mongoSession = await mongoose.startSession();
  let logged = 0;
  try {
    await mongoSession.withTransaction(async () => {
      const existing = await Attendance.findOne(filter)
        .session(mongoSession)
        .select("records.student records.status")
        .lean();

      const changes = diffRecords(existing?.records || [], cleaned);

      if (changes.length > 0) {
        const changedEnrollments = await StudentEnrollment.find({
          _id: { $in: changes.map((c) => c.student) },
        })
          .select("rollNo studentId")
          .populate({
            path: "studentId",
            select: "admno regno",
            populate: { path: "regno", select: "sname" },
          })
          .session(mongoSession)
          .lean();
        const infoMap = new Map(
          changedEnrollments.map((e) => [
            String(e._id),
            {
              studentName: e.studentId?.regno?.sname || "",
              admno: e.studentId?.admno || "",
              rollNo: e.rollNo ?? 0,
            },
          ]),
        );

        const batchId = new mongoose.Types.ObjectId();
        const rows = changes.map((c) => ({
          batchId,
          schId,
          session,
          class: cls,
          section,
          attendanceDate: day,
          student: c.student,
          ...(infoMap.get(String(c.student)) || {}),
          oldStatus: c.oldStatus,
          newStatus: c.newStatus,
          changedBy: actor.id,
          changedByName: actor.name,
          changedByRole: actor.role,
          teacher: teacherId,
          reason,
          daysBack: when.daysBack,
        }));
        await AttendanceAuditLog.insertMany(rows, { session: mongoSession });
        logged = rows.length;
      }

      await Attendance.findOneAndUpdate(filter, update, {
        ...options,
        session: mongoSession,
      });
    });
  } finally {
    await mongoSession.endSession();
  }

  return { date: day, total: cleaned.length, logged };
}

/**
 * Returns a flat list ({ _id, student, status, remark }), one entry per
 * student, so callers don't need to know about the one-document-per-day layout.
 */
async function getAttendanceByDate({
  schId,
  session,
  class: cls,
  section,
  date,
}) {
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

async function getAttendanceLogs({ schId, session, class: cls, section, date, student, limit, page }) {
  if (!schId) {
    const err = new Error("schId is required");
    err.status = 400;
    throw err;
  }
  const query = { schId };
  if (session) query.session = session;
  if (cls) query.class = cls;
  if (section) query.section = section;
  if (student) query.student = student;
  if (date) query.attendanceDate = startOfDay(date);

  const size = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * size;

  const [data, total] = await Promise.all([
    AttendanceAuditLog.find(query).sort({ changedAt: -1 }).skip(skip).limit(size).lean(),
    AttendanceAuditLog.countDocuments(query),
  ]);
  return { total, page: Math.floor(skip / size) + 1, limit: size, data };
}

module.exports = {
  markAttendance,
  getAttendanceByDate,
  getAttendanceLogs,
  assertIsClassTeacher,
};
