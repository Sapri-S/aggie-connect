const router     = require('express').Router();
const auth       = require('../middleware/auth');
const controller = require('../controllers/authController');

// Public routes — no token needed
router.post('/register', controller.register);
router.post('/login',    controller.login);

// Protected route — must be logged in
router.get('/me', auth, controller.me);

module.exports = router;