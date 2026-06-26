require('dotenv').config();
const { connectDB, sequelize } = require('./src/config/db');

const fix = async () => {
    await connectDB();

    // Add column
    await sequelize.query(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS "autoAccept" BOOLEAN DEFAULT false`
    );
    console.log('✅ autoAccept column added');

    // Set bots
    await sequelize.query(
        `UPDATE users SET "autoAccept" = true WHERE "firstName" IN ('James','Aaliyah','Marcus','Jasmine','DeShawn','Brianna','Malik','Keisha','Jordan','Destiny')`
    );
    console.log('✅ 10 bots updated');

    // Verify
    const [results] = await sequelize.query(
        `SELECT "firstName", "lastName", "autoAccept" FROM users WHERE "autoAccept" = true`
    );
    console.log('🤖 Bots in database:');
    results.forEach(r => console.log(`   ${r.firstName} ${r.lastName} — autoAccept: ${r.autoAccept}`));

    process.exit(0);
};

fix().catch(err => {
    console.error('❌ Failed:', err);
    process.exit(1);
});