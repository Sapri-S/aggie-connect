const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protects routes that require admin access.
// Must be used AFTER the auth middleware.
module.exports = function adminOnly(req, res, next) {
    const user = User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }

    if (!user.isAdmin) {
        return res.status(403).json({ message: 'Access denied — admins only.' });
    }

    next();
};