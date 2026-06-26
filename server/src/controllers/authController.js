const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');

const signToken = (user) =>
    jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

const sanitize = (user) => {
    const { password, ...rest } = user.toJSON();
    return rest;
};

// ── POST /api/auth/register ───────────────────────────────────────────────────
exports.register = async (req, res, next) => {
    try {
        const {
            firstName, lastName, email, password,
            role, gradYear, position, industry,
            skills, linkedInUrl, linkedInSync, pastExperience,
        } = req.body;

        // Check if email already exists
        const existing = await User.findOne({ where: { email } });
        if (existing) {
            return res.status(409).json({ message: 'Email already in use.' });
        }

        // Hash password
        const hashed = await bcrypt.hash(password, 12);

        // First user becomes admin automatically
        const userCount  = await User.count();
        const isFirstUser = userCount === 0;

        const newUser = await User.create({
            firstName,
            lastName,
            email,
            password:       hashed,
            role,
            gradYear,
            position:       position       ?? null,
            industry:       industry       ?? null,
            skills:         skills         ?? [],
            linkedInUrl:    linkedInUrl    ?? null,
            linkedInSync:   linkedInSync   ?? false,
            pastExperience: pastExperience ?? [],
            isAdmin:        isFirstUser,
            isApproved:     isFirstUser,
        });

        const token = signToken(newUser);
        res.status(201).json({ token, user: sanitize(newUser) });
    } catch (err) {
        next(err);
    }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = signToken(user);
        res.json({ token, user: sanitize(user) });
    } catch (err) {
        next(err);
    }
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
exports.me = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        res.json(sanitize(user));
    } catch (err) {
        next(err);
    }
};