const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Teacher = require("../models/teacher/teacher");
const ClassTeacherAssignment = require("../models/teacher/classteacherassign");
const AppError = require("../utils/appError");


const teacherService = {
   addTeacher:async({
  name,
  email,
  phone,
  password,
  subjects,
  schId,
  session,
  createdby,
  classTeacherOf,
})=> {
  const existing = await Teacher.findOne({ email, schId });
  if (existing) {
    const err = new Error(
      "A teacher with this email already exists in this school",
    );
    err.status = 409;
    throw err;
  }

  const hashed = await bcrypt.hash(password, 10);

  const teacher = await Teacher.create({
    name,
    email,
    phone,
    password: hashed,
    subjects: subjects || [],
    schId,
    session,
    createdby,
    classTeacherOf,
  });

  return teacher;
},

assignClassToTeacher:async({ teacherId, schId, classes })=> {
  // classes: [{ class, section }, ...]
  const teacher = await Teacher.findOne({ _id: teacherId, schId });
  if (!teacher) {
    const err = new Error("Teacher not found");
    err.status = 404;
    throw err;
  }

  const existingKeys = new Set(
    teacher.assignedClasses.map((c) => `${c.class}-${c.section}`),
  );

  for (const c of classes) {
    const key = `${c.class}-${c.section}`;
    if (!existingKeys.has(key)) {
      teacher.assignedClasses.push({ class: c.class, section: c.section });
      existingKeys.add(key);
    }
  }

  await teacher.save();
  return teacher;
},

makeClassTeacher:async({
  teacherId,
  schId,
  session,
  class: cls,
  section,
  assignedBy,
}) => {
  const teacher = await Teacher.findOne({ _id: teacherId, schId });
  if (!teacher) {
    const err = new Error("Teacher not found");
    err.status = 404;
    throw err;
  }

  // Is this class-section already assigned to a different teacher this session?
  const existingAssignment = await ClassTeacherAssignment.findOne({
    schId,
    session,
    class: cls,
    section,
  });

  if (
    existingAssignment &&
    String(existingAssignment.teacher) !== String(teacherId)
  ) {
    const err = new Error(
      `This class-section already has a class teacher assigned for session ${session}`,
    );
    err.status = 409;
    throw err;
  }

  // Clear any previous class-teacher assignment this teacher held (this session)
  await ClassTeacherAssignment.deleteMany({
    schId,
    session,
    teacher: teacherId,
    class: { $ne: cls },
  });

  const assignment = await ClassTeacherAssignment.findOneAndUpdate(
    { schId, session, class: cls, section },
    { $set: { teacher: teacherId, assignedBy } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  // keep the (previous) class teacher's teacher doc in sync
  await Teacher.updateMany(
    {
      schId,
      session,
      "classTeacherOf.class": cls,
      "classTeacherOf.section": section,
      _id: { $ne: teacherId },
    },
    { $set: { "classTeacherOf.class": null, "classTeacherOf.section": null } },
  );

  teacher.classTeacherOf = { class: cls, section };
  const alreadyAssigned = teacher.assignedClasses.some(
    (c) => c.class === cls && c.section === section,
  );
  if (!alreadyAssigned) {
    teacher.assignedClasses.push({ class: cls, section });
  }
  await teacher.save();

  return { teacher, assignment };
},

 getClassTeacher :async ({ schId, session, class: cls, section })=> {
  return ClassTeacherAssignment.findOne({
    schId,
    session,
    class: cls,
    section,
  }).populate("teacher", "name email");
},

 teacherLogin :async ({ email, password })=> {
  if (!email || !password) {
    throw new Error("Email, password and school are required");
  }

  // Find teacher by email + school
  const teacher = await Teacher.findOne({
    email: email.toLowerCase().trim(),
  })
    .populate("schId", "schName schoolCode")
    .populate("session", "sessionName")
    .populate({
      path: "classTeacherOf.classID",
      select: "className classInWord",
    })
    .populate({
      path: "classTeacherOf.sectionID",
      select: "sectionName Maxlimit",
    });

  if (!teacher) {
    throw new Error("Invalid email or password");
  }

  // Check account status
  if (teacher.status !== "active") {
    throw new Error("Teacher account is inactive");
  }

  // Compare password
  const isPasswordValid = await bcrypt.compare(password, teacher.password);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  // Create JWT payload
  const tokenPayload = {
    id: teacher._id,
    email: teacher.email,
    schId: teacher.schId._id,
    session: teacher.session?._id,
    role: "teacher",
  };

  const accessToken = jwt.sign(tokenPayload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "1d",
  });

  return {
    accessToken,

    teacher: {
      _id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      status: teacher.status,
      schId: teacher.schId,
      session: teacher.session,
      assignedClasses: teacher.assignedClasses,
      classTeacherOf: teacher.classTeacherOf,
    },
  };
}

}


module.exports = teacherService;
