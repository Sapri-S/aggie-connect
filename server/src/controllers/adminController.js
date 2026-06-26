const { Op }     = require('sequelize');
const User       = require('../models/User');
const Connection = require('../models/Connection');

const sanitize = (user) => {
    const { password, ...rest } = user.toJSON();
    return rest;
};

// ── GET /api/admin/users ──────────────────────────────────────────────────────
exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.findAll();
        res.json(users.map(sanitize));
    } catch (err) {
        next(err);
    }
};

// ── GET /api/admin/users/pending ──────────────────────────────────────────────
exports.getPendingUsers = async (req, res, next) => {
    try {
        const users = await User.findAll({
            where: { isApproved: false, isAdmin: false },
        });
        res.json(users.map(sanitize));
    } catch (err) {
        next(err);
    }
};

// ── PATCH /api/admin/users/:id ────────────────────────────────────────────────
exports.editUser = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        const {
            firstName, lastName, email, role, bio,
            title, company, gradYear, position,
            industry, skills, linkedInUrl,
            isApproved, isAdmin,
        } = req.body;

        await user.update({
            firstName, lastName, email, role, bio,
            title, company, gradYear, position,
            industry, skills, linkedInUrl,
            isApproved, isAdmin,
        });

        res.json(sanitize(user));
    } catch (err) {
        next(err);
    }
};

// ── DELETE /api/admin/users/:id ───────────────────────────────────────────────
exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        await user.destroy();
        res.json({ message: 'User deleted successfully.' });
    } catch (err) {
        next(err);
    }
};

// ── PATCH /api/admin/users/:id/approve ───────────────────────────────────────
exports.approveUser = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        await user.update({ isApproved: true });
        res.json({ message: 'User approved.', user: sanitize(user) });
    } catch (err) {
        next(err);
    }
};

// ── PATCH /api/admin/users/:id/reject ────────────────────────────────────────
exports.rejectUser = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        await user.destroy();
        res.json({ message: 'User rejected and removed.' });
    } catch (err) {
        next(err);
    }
};

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
exports.getStats = async (req, res, next) => {
    try {
        const [
            totalUsers,
            totalStudents,
            totalAlumni,
            pendingApprovals,
            totalConnections,
            acceptedConnections,
        ] = await Promise.all([
            User.count(),
            User.count({ where: { role: 'student' } }),
            User.count({ where: { role: 'alumni'  } }),
            User.count({ where: { isApproved: false, isAdmin: false } }),
            Connection.count(),
            Connection.count({ where: { status: 'accepted' } }),
        ]);

        res.json({
            totalUsers,
            totalStudents,
            totalAlumni,
            pendingApprovals,
            totalConnections,
            acceptedConnections,
        });
    } catch (err) {
        next(err);
    }
};