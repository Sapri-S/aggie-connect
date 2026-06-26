const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Connection = sequelize.define('Connection', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    requesterId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    receiverId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('pending', 'accepted', 'declined'),
        defaultValue: 'pending',
    },
    message: {
        type: DataTypes.TEXT,
    },
}, {
    tableName:  'connections',
    timestamps: true,
});

module.exports = Connection;