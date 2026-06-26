const router     = require('express').Router();
const auth       = require('../middleware/auth');
const controller = require('../controllers/connectionController');

// All connection routes require login
router.get   ('/',             auth, controller.getMyConnections);
router.get   ('/accepted',     auth, controller.getAccepted);
router.get   ('/pending',      auth, controller.getPending);
router.post  ('/:receiverId',  auth, controller.sendRequest);
router.patch ('/:id',          auth, controller.updateStatus);
router.delete('/:id',          auth, controller.remove);

module.exports = router;