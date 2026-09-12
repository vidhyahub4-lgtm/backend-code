const router =  require("express").Router();
const schoolSettingController = require('../controllers/schoolSettingController')
const authMiddleware = require("../middileware/auth");


router.post('/create-sch-class', authMiddleware, schoolSettingController.createSchClass );
router.get('/get-sch-class', authMiddleware, schoolSettingController.getSchClass );


module.exports = router;