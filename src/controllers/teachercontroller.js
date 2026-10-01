const teacherService = require("../services/teacherservice");
const asyncHandler = require("../errorHandlers/asyncHandler");
const AppError = require("../utils/appError");

const teacherController = {
  addTeacher: asyncHandler(async (req, res) => {
    const {
      name,
      email,
      phone,
      password,
      subjects,
      session,
      schId,
      classTeacherOf,
    } = req.body;
    const createdby = req.user?._id;

    if (!name || !email || !password || !session) {
      throw new AppError("name, email, password and session are required", 400);
    }

    const teacher = await teacherService.addTeacher({
      name,
      email,
      phone,
      password,
      subjects,
      schId,
      session,
      createdby,
      classTeacherOf,
    });

    return res.status(201).json({ success: true, data: teacher });
  }),

  assignClassToTeacher: asyncHandler(async (req, res) => {
    const { teacherId } = req.params;
    const { classes, schId } = req.body;

    if (!schId) {
      throw new AppError("schId is required", 400);
    }

    if (!Array.isArray(classes) || classes.length === 0) {
      throw new AppError("classes array is required", 400);
    }

    const teacher = await teacherService.assignClassToTeacher({
      teacherId,
      schId,
      classes,
    });

    return res.status(200).json({
      success: true,
      message: "Classes assigned to teacher successfully",
      data: teacher,
    });
  }),

  makeClassTeacher: asyncHandler(async (req, res) => {
    const { teacherId } = req.params;

    const { session, schId, classID, sectionID } = req.body;

    if (!session || !schId || !classID || !sectionID) {
      throw new AppError(
        "session, schId, classID and sectionID are required",
        400,
      );
    }

    const result = await teacherService.makeClassTeacher({
      teacherId,
      schId,
      session,
      classID,
      sectionID,
    });

    return res.status(200).json({
      success: true,
      message: "Class teacher assigned successfully",
      data: result,
    });
  }),

  getClassTeacher: asyncHandler(async (req, res) => {
    const { session, classID, sectionID, schId } = req.query;
    console.log(schId, session);
    if (!schId || !session) {
      throw new AppError("schId and session are required", 400);
    }

    const result = await teacherService.getClassTeacher({
      schId,
      session,
      classID,
      sectionID,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  }),

    getTeachers: asyncHandler(async (req, res) => {
    const { schId, session } = req.query;

    if (!schId) {
      throw new AppError("schId is required", 400);
    }

    const teachers = await teacherService.getTeachers({ schId, session });

    return res.status(200).json({
      success: true,
      count: teachers.length,
      data: teachers,
    });
  }),

  loginTeacher: asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const result = await teacherService.teacherLogin({
      email,
      password,
    });

    return res.status(200).json({
      success: true,
      message: "Teacher login successful",
      data: result,
    });
  }),

  classStudList: asyncHandler(async (req, res) => {
    const { id } = req.teacher;
    console.log("teacher Id ", id);
  }),
};

module.exports = teacherController;
