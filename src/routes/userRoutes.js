const router =  require("express").Router();
const userController = require('../controllers/userController')
const authMiddleware = require("../middileware/auth");
const superAdminMiddleware = require("../middileware/superAdminMiddleware");

router.post('/create-user', userController.createUser );
router.post('/login-user', userController.loginUser );
router.get('/get-users', authMiddleware, superAdminMiddleware, userController.getAllUsers);



module.exports = router