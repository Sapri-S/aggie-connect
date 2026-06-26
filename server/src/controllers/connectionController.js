const { Op }     = require('sequelize');
const Connection = require('../models/Connection');
const User       = require('../models/User');

// ── GET /api/connections ──────────────────────────────────────────────────────
exports.getMyConnections = async (req, res, next) => {
    try {
        const connections = await Connection.findAll({
            where: {
                [Op.or]: [
                    { requesterId: req.user.id },
                    { receiverId:  req.user.id },
                ],
            },
        });
        res.json(connections);
    } catch (err) {
        next(err);
    }
};

// ── GET /api/connections/accepted ─────────────────────────────────────────────
exports.getAccepted = async (req, res, next) => {
    try {
        const connections = await Connection.findAll({
            where: {
                status: 'accepted',
                [Op.or]: [
                    { requesterId: req.user.id },
                    { receiverId:  req.user.id },
                ],
            },
        });
        res.json(connections);
    } catch (err) {
        next(err);
    }
};

// ── GET /api/connections/pending ──────────────────────────────────────────────
exports.getPending = async (req, res, next) => {
    try {
        const connections = await Connection.findAll({
            where: {
                receiverId: req.user.id,
                status:     'pending',
            },
        });
        res.json(connections);
    } catch (err) {
        next(err);
    }
};

// ── POST /api/connections/:receiverId ─────────────────────────────────────────
exports.sendRequest = async (req, res, next) => {
    try {
        const requesterId = req.user.id;
        const receiverId  = Number(req.params.receiverId);
        const { message } = req.body;

        if (requesterId === receiverId) {
            return res.status(400).json({ message: 'Cannot connect with yourself.' });
        }

        const receiver = await User.findByPk(receiverId);
        if (!receiver) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const existing = await Connection.findOne({
            where: {
                [Op.or]: [
                    { requesterId, receiverId },
                    { requesterId: receiverId, receiverId: requesterId },
                ],
            },
        });

        if (existing) {
            return res.status(409).json({
                message: 'Connection already exists.',
                connection: existing,
            });
        }

        const connection = await Connection.create({
            requesterId,
            receiverId,
            message: message ?? '',
        });



        res.status(201).json(connection);
    } catch (err) {
        next(err);
    }
};

// ── PATCH /api/connections/:id ────────────────────────────────────────────────
exports.updateStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        if (!['accepted', 'declined'].includes(status)) {
            return res.status(400).json({ message: 'Status must be "accepted" or "declined".' });
        }

        const connection = await Connection.findOne({
            where: {
                id:         req.params.id,
                receiverId: req.user.id,
            },
        });

        if (!connection) {
            return res.status(404).json({ message: 'Connection request not found.' });
        }

        await connection.update({ status });

        

        res.json(connection);
    } catch (err) {
        next(err);
    }
};

// ── DELETE /api/connections/:id ───────────────────────────────────────────────
exports.remove = async (req, res, next) => {
    try {
        const connection = await Connection.findOne({
            where: {
                id: req.params.id,
                [Op.or]: [
                    { requesterId: req.user.id },
                    { receiverId:  req.user.id },
                ],
            },
        });

        if (!connection) {
            return res.status(404).json({ message: 'Connection not found.' });
        }

        await connection.destroy();
        res.json({ message: 'Connection removed.' });
    } catch (err) {
        next(err);
    }
};