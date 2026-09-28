const teacherService = require("../services/teacherservice");
const asyncHandler = require("../errorHandlers/asyncHandler");
const AppError = require("../utils/appError");

const teacherController = {
  addTeacher: asyncHandler(async(req, res)=> {

    const { name, email, phone, password, subjects, session, schId,classTeacherOf } = req.body;
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
      classTeacherOf
    });

    return res.status(201).json({ success: true, data: teacher });
  
}),

assignClassToTeacher: asyncHandler(async(req, res)=> {

    const { teacherId } = req.params;
    const { classes } = req.body;
    const schId = req.user?.schId || req.body.schId;

    if (!Array.isArray(classes) || classes.length === 0) {
      // return res.status(400).json({ success: false, message: "classes array is required" });
        throw new AppError("classes array is required", 400);
    }

    const teacher = await teacherService.assignClassToTeacher({ teacherId, schId, classes });
    return res.status(200).json({ success: true, data: teacher });
  
}),

makeClassTeacher:asyncHandler(async(req, res)=> {
    const { teacherId } = req.params;
    const { session, class: cls, section } = req.body;
    const schId = req.user?.schId || req.body.schId;
    const assignedBy = req.user?._id;

    if (!session || !cls || !section) {
      // return res.status(400).json({ success: false, message: "" });
        throw new AppError("session, class and section are required", 400);
    }

    const result = await teacherService.makeClassTeacher({
      teacherId,
      schId,
      session,
      class: cls,
      section,
      assignedBy,
    });

    return res.status(200).json({ success: true, data: result });
 
}),

getClassTeacher:asyncHandler(async(req, res)=> {

    const { session, class: cls, section } = req.query;
    const schId = req.user?.schId || req.query.schId;

    const assignment = await teacherService.getClassTeacher({ schId, session, class: cls, section });
    return res.status(200).json({ success: true, data: assignment });
  
}),

loginTeacher:asyncHandler(async (req, res)=> {
 
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

classStudList:asyncHandler(async(req, res)=>{
  const {id } = req.teacher;
  console.log("teacher Id ", id)
})


}


module.exports = teacherController;



