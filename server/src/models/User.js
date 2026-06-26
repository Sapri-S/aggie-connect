const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
    id: {
        type:          DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
    },
    firstName:      { type: DataTypes.STRING,  allowNull: false },
    lastName:       { type: DataTypes.STRING,  allowNull: false },
    email:          { type: DataTypes.STRING,  allowNull: false, unique: true },
    password:       { type: DataTypes.STRING,  allowNull: false },
    role:           { type: DataTypes.ENUM('student', 'alumni'), allowNull: false },
    gradYear:       { type: DataTypes.INTEGER },
    bio:            { type: DataTypes.TEXT },
    title:          { type: DataTypes.STRING },
    company:        { type: DataTypes.STRING },
    position:       { type: DataTypes.STRING },
    industry:       { type: DataTypes.STRING },
    skills:         { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    linkedInUrl:    { type: DataTypes.STRING },
    linkedInSync:   { type: DataTypes.BOOLEAN, defaultValue: false },
    linkedInData:   { type: DataTypes.JSONB },
    lastSynced:     { type: DataTypes.DATE },
    pastExperience: { type: DataTypes.JSONB,   defaultValue: [] },
    photoUrl:       { type: DataTypes.STRING },
    isAdmin:        { type: DataTypes.BOOLEAN, defaultValue: false },
    isApproved:     { type: DataTypes.BOOLEAN, defaultValue: false },
    autoAccept:     { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
    tableName:  'users',
    timestamps: true,
});

module.exports = User;