const router =  require("express").Router();
const dev_super_controller = require('../controllers/dev_super_controller')


router.post('/create-session', dev_super_controller.createSession)
router.get('/get-all-session', dev_super_controller.getSession)

module.exports = router