const teacherService = require("../services/teacherservice");

// POST /api/teachers
async function addTeacher(req, res) {
  try {
    const { name, email, phone, password, subjects, session, schId,classTeacherOf } = req.body;
    const createdby = req.user?._id;

    if (!name || !email || !password || !session) {
      return res.status(400).json({ success: false, message: "name, email, password and session are required" });
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
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

// POST /api/teachers/:teacherId/assign-class
// body: { classes: [{ class, section }] }
async function assignClassToTeacher(req, res) {
  try {
    const { teacherId } = req.params;
    const { classes } = req.body;
    const schId = req.user?.schId || req.body.schId;

    if (!Array.isArray(classes) || classes.length === 0) {
      return res.status(400).json({ success: false, message: "classes array is required" });
    }

    const teacher = await teacherService.assignClassToTeacher({ teacherId, schId, classes });
    return res.status(200).json({ success: true, data: teacher });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

// POST /api/teachers/:teacherId/make-class-teacher
// body: { session, class, section }
async function makeClassTeacher(req, res) {
  try {
    const { teacherId } = req.params;
    const { session, class: cls, section } = req.body;
    const schId = req.user?.schId || req.body.schId;
    const assignedBy = req.user?._id;

    if (!session || !cls || !section) {
      return res.status(400).json({ success: false, message: "session, class and section are required" });
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
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

// GET /api/teachers/class-teacher?session=&class=&section=
async function getClassTeacher(req, res) {
  try {
    const { session, class: cls, section } = req.query;
    const schId = req.user?.schId || req.query.schId;

    const assignment = await teacherService.getClassTeacher({ schId, session, class: cls, section });
    return res.status(200).json({ success: true, data: assignment });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
}



async function loginTeacher (req, res) {
  try {
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
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};


async function classStudList(req, res){
  const {id } = req.teacher;
  console.log("teacher Id ", id)
}

module.exports = { addTeacher, assignClassToTeacher, makeClassTeacher, getClassTeacher,loginTeacher, classStudList };