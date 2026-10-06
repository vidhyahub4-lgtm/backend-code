const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Teacher = require("../models/teacher/teacher");
const ClassTeacherAssignment = require("../models/teacher/classteacherassign");
const studentEnrollmentSchema = require("../models/school-setting/Studentenrollment");
const AppError = require("../utils/appError");

const teacherService = {
  addTeacher: async ({
    name,
    email,
    phone,
    password,
    subjects,
    schId,
    session,
    createdby,
    classTeacherOf,
  }) => {
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

  assignClassToTeacher: async ({ teacherId, schId, classes }) => {
    const teacher = await Teacher.findOne({
      _id: teacherId,
      schId,
    });

    if (!teacher) {
      throw new AppError("Teacher not found", 404);
    }

    for (const item of classes) {
      const { classID, sectionID, subjects = [] } = item;

      if (!classID || !sectionID) {
        throw new AppError("classID and sectionID are required", 400);
      }

      // Check whether class + section already exists
      const existingClass = teacher.assignedClasses.find(
        (assigned) =>
          assigned.classID &&
          assigned.sectionID &&
          assigned.classID.toString() === classID.toString() &&
          assigned.sectionID.toString() === sectionID.toString(),
      );

      if (existingClass) {
        existingClass.timing = item.timing || existingClass.timing;

        for (const subject of subjects) {
          if (!subject.subId) {
            throw new AppError("subId is required for every subject", 400);
          }

          const existingSubject = existingClass.subjects.find(
            (s) => s.subId && s.subId.toString() === subject.subId.toString(),
          );

          if (!existingSubject) {
            existingClass.subjects.push({
              subId: subject.subId,
              subCode: subject.subCode,
              subName: subject.subName,
            });
          }
        }
      } else {
        // Add new class-section
        teacher.assignedClasses.push({
          classID,
          sectionID,
          timing: item.timing || "",
          subjects: subjects.map((subject) => {
            if (!subject.subId) {
              throw new AppError("subId is required for every subject", 400);
            }

            return {
              subId: subject.subId,
              subCode: subject.subCode,
              subName: subject.subName,
            };
          }),
        });
      }
    }

    await teacher.save();

    return teacher;
  },

  makeClassTeacher: async ({
    teacherId,
    schId,
    session,
    classID,
    sectionID,
  }) => {
    // 1. Find teacher
    const teacher = await Teacher.findOne({
      _id: teacherId,
      schId,
      session,
    });

    if (!teacher) {
      const err = new Error("Teacher not found");
      err.status = 404;
      throw err;
    }

    // 2. Check whether this class + section
    // is already assigned to ANY teacher
    const existingTeacher = await Teacher.findOne({
      schId,
      session,
      classTeacherOf: {
        $elemMatch: {
          classID: classID,
          sectionID: sectionID,
        },
      },
    });

    if (existingTeacher) {
      // Same teacher trying to assign again
      if (String(existingTeacher._id) === String(teacherId)) {
        const err = new Error(
          "This teacher is already the class teacher of this class-section",
        );
        err.status = 409;
        throw err;
      }

      // Another teacher already has this class-section
      const err = new Error(
        "This class-section is already assigned to another teacher",
      );
      err.status = 409;
      throw err;
    }

    // 3. Add class + section to teacher
    teacher.classTeacherOf.push({
      classID,
      sectionID,
    });

    await teacher.save();

    return teacher;
  },
  getClassTeacher: async ({ schId, session, classID, sectionID }) => {
    const query = {
      schId,
      session,
      classTeacherOf: {
        $exists: true,
        $ne: [],
      },
    };

    // Filter by class if provided
    if (classID) {
      query.classTeacherOf.$elemMatch = {
        classID,
        ...(sectionID ? { sectionID } : {}),
      };
    }

    const teachers = await Teacher.find(query)
      .select("name email phone classTeacherOf")
      .populate("classTeacherOf.classID", "className classInWord")
      .populate("classTeacherOf.sectionID", "sectionName");

    return teachers;
  },

    getTeachers: async ({ schId, session }) => {
    const query = { schId };
    if (session) query.session = session;

    const teachers = await Teacher.find(query)
      .select("-password")
      .sort({ name: 1 })
      .populate("assignedClasses.classID", "className classInWord")
      .populate("assignedClasses.sectionID", "sectionName")
      .populate("classTeacherOf.classID", "className classInWord")
      .populate("classTeacherOf.sectionID", "sectionName");

    return teachers;
  },

  teacherLogin: async ({ email, password }) => {
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
  },

  classStudList: async ({ teacherid }) => {
    if (!teacherid) {
      throw new AppError("teacherid is required", 400);
    }
    let teacher = await Teacher.findById(teacherid)
      .select("classTeacherOf.classID classTeacherOf.sectionID" );

    if (!teacher) {
      throw new AppError("Teacher not found", 404);
    }
    let stud = await studentEnrollmentSchema.find({
      classID: teacher.classTeacherOf[0].classID,
      sectionId: teacher.classTeacherOf[0].sectionID,
    }).populate({
      path: "studentId",
      select: "admno",
      populate: {
        path: "regno",
        select: "sname dob email whatAppno mob1 mob2 age fname category gender Image mname fname",
      },
    })
    .select("rollNo status");
    return stud;
  }
}
module.exports = teacherService;
