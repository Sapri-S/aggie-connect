const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    },
    logging: false,
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected successfully');
        await sequelize.sync({ alter: false });
        console.log('✅ Database synced');
    } catch (err) {
        console.error('❌ Database connection failed:', err);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
module.exports = { sequelize, connectDB };

