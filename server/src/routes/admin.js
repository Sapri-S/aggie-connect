const router     = require('express').Router();
const auth       = require('../middleware/auth');
const adminOnly  = require('../middleware/admin');
const controller = require('../controllers/adminController');

// All admin routes require both auth AND admin role
router.get   ('/users',              auth, adminOnly, controller.getAllUsers);
router.get   ('/users/pending',      auth, adminOnly, controller.getPendingUsers);
router.patch ('/users/:id',          auth, adminOnly, controller.editUser);
router.delete('/users/:id',          auth, adminOnly, controller.deleteUser);
router.patch ('/users/:id/approve',  auth, adminOnly, controller.approveUser);
router.patch ('/users/:id/reject',   auth, adminOnly, controller.rejectUser);
router.get   ('/stats',              auth, adminOnly, controller.getStats);

module.exports = router;