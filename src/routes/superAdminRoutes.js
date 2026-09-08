const router =  require("express").Router();
const superAdminController = require("../controllers/superAdminController");
const upload = require("../middileware/upload.middleware");
const authMiddleware = require("../middileware/auth");

router.post("/create-sidebar",upload.single("image"), superAdminController.createSidebar);
// router.get("/get-sidebar", superAdminController.getSidebar);

router.post('/create-board', authMiddleware, superAdminController.createBoard);


module.exports = router;