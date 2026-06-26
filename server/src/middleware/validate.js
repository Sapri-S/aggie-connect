const { body, validationResult } = require('express-validator');

// Middleware to check validation results
exports.validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array()[0].msg,
            errors: errors.array(),
        });
    }
    next();
};

// ── Register validation rules ─────────────────────────────────────────────────
exports.registerRules = [
    body('firstName')
        .trim()
        .notEmpty().withMessage('First name is required.')
        .isLength({ max: 50 }).withMessage('First name must be under 50 characters.'),

    body('lastName')
        .trim()
        .notEmpty().withMessage('Last name is required.')
        .isLength({ max: 50 }).withMessage('Last name must be under 50 characters.'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required.')
        .isEmail().withMessage('Please enter a valid email address.')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required.')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
        .matches(/[0-9]/).withMessage('Password must contain at least one number.'),

    body('role')
        .notEmpty().withMessage('Role is required.')
        .isIn(['student', 'alumni']).withMessage('Role must be student or alumni.'),

    body('gradYear')
        .notEmpty().withMessage('Graduation year is required.')
        .isInt({ min: 1900, max: 2099 }).withMessage('Please enter a valid graduation year.'),
];

// ── Login validation rules ────────────────────────────────────────────────────
exports.loginRules = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required.')
        .isEmail().withMessage('Please enter a valid email address.')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required.'),
];

// ── Profile update validation rules ──────────────────────────────────────────
exports.updateProfileRules = [
    body('firstName')
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage('First name must be under 50 characters.'),

    body('lastName')
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage('Last name must be under 50 characters.'),

    body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Bio must be under 500 characters.'),

    body('linkedInUrl')
        .optional()
        .trim()
        .isURL().withMessage('Please enter a valid LinkedIn URL.'),
];