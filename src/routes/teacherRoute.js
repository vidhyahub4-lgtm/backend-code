const express = require("express");
const router = express.Router();
const teacherController = require("../controllers/teachercontroller");
// const { authenticate, authorize } = require("../middleware/auth"); // plug in your existing JWT middleware
const authMiddleware = require("../middileware/auth");
const teacherAuth = require('../middileware/teacherAuth')
// router.use(authenticate);

router.post("/",authMiddleware, teacherController.addTeacher);
router.post("/:teacherId/assign-class", teacherController.assignClassToTeacher);
router.post("/:teacherId/make-class-teacher", teacherController.makeClassTeacher);
router.get("/class-teacher", teacherController.getClassTeacher);


router.post("/login", teacherController.loginTeacher);
router.get('/class-student-list',teacherAuth, teacherController.classStudList)

module.exports = router;