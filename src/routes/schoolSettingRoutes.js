const router =  require("express").Router();
const schoolSettingController = require('../controllers/schoolSettingController')
const authMiddleware = require("../middileware/auth");


router.post('/create-sch-class', authMiddleware, schoolSettingController.createSchClass );
router.get('/get-sch-class', authMiddleware, schoolSettingController.getSchClass );


router.post('/create-sch-house',authMiddleware, schoolSettingController.createSchHouse )
router.get('/get-sch-house',authMiddleware, schoolSettingController.getSchHouse )



module.exports = router;