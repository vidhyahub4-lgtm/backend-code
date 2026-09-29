const router = require("express").Router();
const authMiddleware = require("../middileware/auth");
const studentController = require('../controllers/studentController')

router.get('/get-allstudentof-clas', authMiddleware,studentController.getAllStudentofClass)




module.exports = router;
