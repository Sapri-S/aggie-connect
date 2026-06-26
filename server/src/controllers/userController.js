const { Op } = require('sequelize');
const User   = require('../models/User');

const sanitize = (user) => {
    const { password, ...rest } = user.toJSON();
    return rest;
};

// ── GET /api/users ────────────────────────────────────────────────────────────
exports.getAll = async (req, res, next) => {
    try {
        const { search, role, industry, position, skill, company } = req.query;

        const where = {};

        if (role)     where.role     = role;
        if (industry) where.industry = { [Op.iLike]: `%${industry}%` };
        if (position) where.position = { [Op.iLike]: `%${position}%` };
        if (company)  where.company  = { [Op.iLike]: `%${company}%`  };

        if (search) {
            const term = `%${search}%`;
            where[Op.or] = [
                { firstName: { [Op.iLike]: term } },
                { lastName:  { [Op.iLike]: term } },
                { position:  { [Op.iLike]: term } },
                { industry:  { [Op.iLike]: term } },
                { company:   { [Op.iLike]: term } },
            ];
        }

        if (skill) {
            where.skills = { [Op.contains]: [skill] };
        }

        const users = await User.findAll({ where });
        res.json(users.map(sanitize));
    } catch (err) {
        next(err);
    }
};

// ── GET /api/users/:id ────────────────────────────────────────────────────────
exports.getOne = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        res.json(sanitize(user));
    } catch (err) {
        next(err);
    }
};

// ── PATCH /api/users/:id ──────────────────────────────────────────────────────
exports.update = async (req, res, next) => {
    try {
        if (req.user.id !== Number(req.params.id)) {
            return res.status(403).json({ message: 'Not authorized to edit this profile.' });
        }

        const {
            firstName, lastName, bio, title, company,
            gradYear, position, industry, skills,
            linkedInUrl, linkedInSync, pastExperience,
        } = req.body;

        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        await user.update({
            firstName, lastName, bio, title, company,
            gradYear, position, industry, skills,
            linkedInUrl, linkedInSync, pastExperience,
        });

        res.json(sanitize(user));
    } catch (err) {
        next(err);
    }
};

// ── DELETE /api/users/:id ─────────────────────────────────────────────────────
exports.remove = async (req, res, next) => {
    try {
        if (req.user.id !== Number(req.params.id)) {
            return res.status(403).json({ message: 'Not authorized.' });
        }
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        await user.destroy();
        res.json({ message: 'Account deleted.' });
    } catch (err) {
        next(err);
    }
};