const mongoose = require("mongoose");
const StudentEnrollment = require("../models/school-setting/Studentenrollment");
const StudentAdmission = require("../models/school-setting/Studentadmission");
const NewStudentRegistration = require("../models/school-setting/newRegistration");
const Attendance = require("../models/teacher/attendance");
const Teacher = require("../models/teacher/teacher");
const Class = require("../models/super-admin/class");
const Section = require("../models/super-admin/section");

const TREND_DAYS = 7;
const APP_TIME_ZONE = "Asia/Kolkata";

const badRequest = (message) => Object.assign(new Error(message), { status: 400 });

// Same normalisation attendanceservice uses when it stores `date`.
function startOfDay(date) {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
}

/** Today's date as yyyy-mm-dd in IST. */
const todayYMD = () => new Date().toLocaleDateString("en-CA", { timeZone: APP_TIME_ZONE });

/** yyyy-mm-dd, `daysBack` days before `ymd` (pure date arithmetic, no time zone drift). */
function shiftYMD(ymd, daysBack) {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - daysBack);
  return d.toISOString().slice(0, 10);
}

const naturalCompare = (a, b) => String(a).localeCompare(String(b), undefined, { numeric: true });

/**
 * Pure calculation (no DB) so it can be tested with plain objects.
 * Everything arrives already queried; this only combines it into the response.
 */
function buildSummary({ today, enrollGroups, genderGroups, attendanceDocs, trendGroups, teachers, classNames, sectionNames }) {
  const key = (c, s) => `${c}:${s}`;

  // class-section -> class teacher name (active teachers only)
  const teacherByClass = new Map();
  for (const t of teachers) {
    if (t.status !== "active") continue;
    for (const c of t.classTeacherOf || []) {
      if (!teacherByClass.has(key(c.classID, c.sectionID))) teacherByClass.set(key(c.classID, c.sectionID), t.name);
    }
  }

  // class-section -> today's attendance counts
  const todayByClass = new Map();
  for (const doc of attendanceDocs) {
    if (!doc.records || doc.records.length === 0) continue;
    const counts = { present: 0, absent: 0, late: 0, leave: 0 };
    for (const r of doc.records) if (r.status in counts) counts[r.status] += 1;
    todayByClass.set(key(doc.class, doc.section), counts);
  }

  const classWise = enrollGroups
    .map((g) => {
      const c = String(g._id.c);
      const s = String(g._id.s);
      const counts = todayByClass.get(key(c, s));
      return {
        classId: c,
        sectionId: s,
        className: classNames.get(c) || "—",
        sectionName: sectionNames.get(s) || "—",
        total: g.total,
        marked: Boolean(counts),
        present: counts?.present ?? 0,
        absent: counts?.absent ?? 0,
        late: counts?.late ?? 0,
        leave: counts?.leave ?? 0,
        classTeacher: teacherByClass.get(key(c, s)) || null,
      };
    })
    .sort((a, b) => naturalCompare(a.className, b.className) || naturalCompare(a.sectionName, b.sectionName));

  const sum = (field) => classWise.reduce((n, r) => n + r[field], 0);
  const gender = { male: 0, female: 0, other: 0 };
  for (const g of genderGroups) gender[g._id === "male" || g._id === "female" ? g._id : "other"] += g.count;

  // last N days, oldest first; days nobody marked have total 0 (pct null)
  const trendMap = new Map(trendGroups.map((g) => [new Date(g._id).getTime(), g]));
  const trend = Array.from({ length: TREND_DAYS }, (_, i) => {
    const date = shiftYMD(today, TREND_DAYS - 1 - i);
    const g = trendMap.get(startOfDay(date).getTime());
    const total = g?.total ?? 0;
    const present = g?.present ?? 0;
    return { date, present, total, pct: total ? Math.round((present / total) * 100) : null };
  });

  return {
    date: today,
    students: { total: sum("total"), boys: gender.male, girls: gender.female, other: gender.other },
    teachers: {
      total: teachers.length,
      active: teachers.filter((t) => t.status === "active").length,
      classTeachers: teachers.filter((t) => t.status === "active" && (t.classTeacherOf || []).length > 0).length,
    },
    attendance: {
      classesTotal: classWise.length,
      classesMarked: classWise.filter((r) => r.marked).length,
      markedStudents: sum("present") + sum("absent") + sum("late") + sum("leave"),
      present: sum("present"),
      absent: sum("absent"),
      late: sum("late"),
      leave: sum("leave"),
    },
    classWise,
    trend,
    attention: {
      notMarked: classWise.filter((r) => !r.marked),
      noClassTeacher: classWise.filter((r) => !r.classTeacher),
    },
  };
}

async function getSummary({ schId, session }) {
  if (!mongoose.isValidObjectId(schId)) throw badRequest("A valid schId is required");
  if (!mongoose.isValidObjectId(session)) throw badRequest("A valid session is required");

  const sch = new mongoose.Types.ObjectId(String(schId));
  const sess = new mongoose.Types.ObjectId(String(session));
  const today = todayYMD();
  const day = startOfDay(today);
  const trendFrom = startOfDay(shiftYMD(today, TREND_DAYS - 1));
  const enrollMatch = { schId: sch, session: sess, status: "active" };
  const attendanceMatch = { schId: sch, session: String(session) }; // Attendance.session is stored as a string

  const [enrollGroups, genderGroups, attendanceDocs, trendGroups, teachers] = await Promise.all([
    StudentEnrollment.aggregate([
      { $match: enrollMatch },
      { $group: { _id: { c: "$classID", s: "$sectionId" }, total: { $sum: 1 } } },
    ]),
    // enrollment -> admission -> registration (gender lives on the registration)
    StudentEnrollment.aggregate([
      { $match: enrollMatch },
      { $lookup: { from: StudentAdmission.collection.name, localField: "studentId", foreignField: "_id", as: "adm" } },
      { $unwind: "$adm" },
      { $lookup: { from: NewStudentRegistration.collection.name, localField: "adm.regno", foreignField: "_id", as: "reg" } },
      { $unwind: "$reg" },
      { $group: { _id: { $toLower: { $ifNull: ["$reg.gender", "other"] } }, count: { $sum: 1 } } },
    ]),
    Attendance.find({ ...attendanceMatch, date: day }).select("class section records.status").lean(),
    Attendance.aggregate([
      { $match: { ...attendanceMatch, date: { $gte: trendFrom, $lte: day } } },
      { $unwind: "$records" },
      {
        $group: {
          _id: "$date",
          present: { $sum: { $cond: [{ $in: ["$records.status", ["present", "late"]] }, 1, 0] } },
          total: { $sum: 1 },
        },
      },
    ]),
    Teacher.find({ schId: sch, session: sess }).select("name status classTeacherOf").lean(),
  ]);

  const classIds = [...new Set(enrollGroups.map((g) => String(g._id.c)))];
  const sectionIds = [...new Set(enrollGroups.map((g) => String(g._id.s)))];
  const [classDocs, sectionDocs] = await Promise.all([
    Class.find({ _id: { $in: classIds } }).select("className").lean(),
    Section.find({ _id: { $in: sectionIds } }).select("sectionName").lean(),
  ]);

  return buildSummary({
    today,
    enrollGroups,
    genderGroups,
    attendanceDocs,
    trendGroups,
    teachers,
    classNames: new Map(classDocs.map((c) => [String(c._id), c.className])),
    sectionNames: new Map(sectionDocs.map((s) => [String(s._id), s.sectionName])),
  });
}

module.exports = { getSummary, buildSummary };