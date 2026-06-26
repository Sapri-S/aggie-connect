const router     = require('express').Router();
const auth       = require('../middleware/auth');
const { updateProfileRules, validate } = require('../middleware/validate');
const controller = require('../controllers/userController');

router.get   ('/',    auth, controller.getAll);
router.get   ('/:id', auth, controller.getOne);
router.patch ('/:id', auth, updateProfileRules, validate, controller.update);
router.delete('/:id', auth, controller.remove);

module.exports = router;