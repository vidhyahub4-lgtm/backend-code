const router =  require("express").Router();
const schoolSettingController = require('../controllers/schoolSettingController')
const authMiddleware = require("../middileware/auth");


router.post('/create-sch-class', authMiddleware, schoolSettingController.createSchClass );


module.exports = router;