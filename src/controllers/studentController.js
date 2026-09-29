const asyncHandler = require("../errorHandlers/asyncHandler");
const AppError = require("../utils/appError");
const studentservice= require('../services/studentdservice')

const studentController = {
  getAllStudentofClass: asyncHandler(async (req, res) => {
    const { classId, sectionId } = req.body;

    if (!classId) {
      throw new AppError("classId is required", 400);
    }

    const studentlist = await studentservice.getAllStudentofClass({
      classId,
      sectionId,
    });

    res.status(200).json({
      success: true,
      count: studentlist.length,
      studentlist,
    });
  }),
};

module.exports = studentController;
