const Attendance = require("../models/teacher/attendance");
const ClassTeacherAssignment = require("../models/teacher/classteacherassign");

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

/**
 * Mark attendance for a whole class-section on a date in one call.
 * records: [{ student, status, remark }]
 */
async function markAttendance({ schId, session, class: cls, section, date, records, teacherId }) {
  await assertIsClassTeacher({ schId, session, class: cls, section, teacherId });

  const day = new Date(date);
  day.setHours(0, 0, 0, 0);

  const ops = records.map((r) => ({
    updateOne: {
      filter: {
        schId,
        session,
        class: cls,
        section,
        date: day,
        student: r.student,
      },
      update: {
        $set: {
          status: r.status,
          remark: r.remark || "",
          markedBy: teacherId,
        },
      },
      upsert: true,
    },
  }));

  const result = await Attendance.bulkWrite(ops);
  return result;
}

async function getAttendanceByDate({ schId, session, class: cls, section, date }) {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);

  return Attendance.find({ schId, session, class: cls, section, date: day }).populate(
    "student",
    "name rollno"
  );
}

module.exports = { markAttendance, getAttendanceByDate, assertIsClassTeacher };