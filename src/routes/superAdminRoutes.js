const router =  require("express").Router();
const superAdminController = require("../controllers/superAdminController");
const upload = require("../middileware/upload.middleware");
const authMiddleware = require("../middileware/auth");
const superAdminMiddleware = require("../middileware/superAdminMiddleware");

router.post("/create-sidebar",upload.single("image"), superAdminController.createSidebar);
// router.get("/get-sidebar", superAdminController.getSidebar);

router.post('/create-board', authMiddleware,superAdminMiddleware, superAdminController.createBoard);
router.get('/get-board', authMiddleware, superAdminController.getBoard);


router.post('/create-institute-type', authMiddleware,superAdminMiddleware, superAdminController.createInstituteType);
router.get('/get-institute-type', authMiddleware, superAdminController.getInstituteType);

router.post('/create-state', authMiddleware,superAdminMiddleware, superAdminController.createState);
router.get('/get-state', authMiddleware, superAdminController.getState);

router.post('/create-city', authMiddleware,superAdminMiddleware, superAdminController.createCity);
router.get('/get-city', authMiddleware, superAdminController.getCity);

router.post('/create-class', authMiddleware,superAdminMiddleware, superAdminController.createClass);
router.get('/get-class', authMiddleware, superAdminController.getClass);

router.post('/create-section', authMiddleware,superAdminMiddleware, superAdminController.createSection);
router.get('/get-section', authMiddleware, superAdminController.getSection);


router.post('/create-school', authMiddleware,superAdminMiddleware, upload.single('logo'), superAdminController.createSchool);
router.get('/get-school', authMiddleware, superAdminController.getSchool);


router.post('/create-school-pay-mode', authMiddleware,superAdminMiddleware, superAdminController.createFeeStructure);


module.exports = router;