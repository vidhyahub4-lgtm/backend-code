const router =  require("express").Router();
const userController = require('../controllers/userController')

router.post('/create-user', userController.createUser );
router.post('/login-user', userController.loginUser );



module.exports = router