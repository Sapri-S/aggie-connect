require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB } = require('./src/config/db');
const User = require('./src/models/User');

const firstNames = [
    'James', 'Aaliyah', 'Marcus', 'Jasmine', 'DeShawn', 'Brianna', 'Malik',
    'Keisha', 'Jordan', 'Destiny', 'Andre', 'Tiffany', 'Xavier', 'Monique',
    'Darius', 'Simone', 'Elijah', 'Natasha', 'Isaiah', 'Camille', 'Terrence',
    'Alexis', 'Kendall', 'Imani', 'Devon', 'Latoya', 'Brandon', 'Shaniqua',
    'Tyrone', 'Ebony', 'Quinton', 'Tamara', 'Dominic', 'Yolanda', 'Rashad',
    'Crystal', 'Dwayne', 'Rochelle', 'Jalen', 'Priya', 'Carlos', 'Amara',
    'Trevor', 'Zoe', 'Darren', 'Kiara', 'Nathan', 'Selena', 'Miles', 'Aisha',
    'Imani', 'EJ', 'Madison', 'Antonio',
];

const lastNames = [
    'Williams', 'Johnson', 'Brown', 'Davis', 'Wilson', 'Moore', 'Taylor',
    'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson',
    'Robinson', 'Clark', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young',
    'King', 'Wright', 'Scott', 'Green', 'Baker', 'Adams', 'Nelson', 'Carter',
    'Mitchell', 'Perez', 'Roberts', 'Turner', 'Phillips', 'Campbell', 'Parker',
    'Evans', 'Edwards', 'Collins', 'Stewart', 'Morris', 'Rogers', 'Reed',
    'Cook', 'Morgan', 'Bell', 'Murphy', 'Bailey', 'Rivera',
    'Dinkins', 'Lockhard', 'Pegram', 'DesRavines',
];

const positions = [
    'Software Engineer', 'Full Stack Developer', 'Data Scientist',
    'DevOps Engineer', 'Cybersecurity Analyst', 'Product Manager',
    'UX Designer', 'Machine Learning Engineer', 'Backend Developer',
    'Frontend Developer', 'Cloud Architect', 'Database Administrator',
    'Systems Analyst', 'Network Engineer', 'IT Consultant',
];

const companies = [
    'Google', 'Microsoft', 'Amazon', 'Apple', 'Meta', 'IBM', 'Oracle',
    'Cisco', 'Dell', 'Salesforce', 'Netflix', 'Uber', 'Airbnb', 'Twitter',
    'LinkedIn', 'Deloitte', 'Accenture', 'Lockheed Martin', 'Boeing', 'NASA',
];

const industries = [
    'Technology', 'Finance', 'Healthcare', 'Defense', 'Consulting',
    'Education', 'Cybersecurity', 'Cloud Computing', 'AI & Machine Learning',
];

const skillSets = [
    ['Python', 'Django', 'PostgreSQL'],
    ['React', 'Node.js', 'MongoDB'],
    ['Java', 'Spring Boot', 'MySQL'],
    ['C++', 'Embedded Systems', 'IoT'],
    ['AWS', 'Docker', 'Kubernetes'],
    ['Machine Learning', 'TensorFlow', 'Python'],
    ['Cybersecurity', 'Penetration Testing', 'Linux'],
    ['TypeScript', 'Angular', 'Firebase'],
    ['Data Analysis', 'R', 'Tableau'],
    ['Swift', 'iOS Development', 'Xcode'],
];

const pastExperienceSets = [
    [{ company: 'IBM',       title: 'Software Intern',  startYear: '2019', endYear: '2020' }],
    [{ company: 'Google',    title: 'SWE Intern',        startYear: '2020', endYear: '2021' }],
    [{ company: 'Microsoft', title: 'Data Intern',       startYear: '2018', endYear: '2019' }],
    [{ company: 'Cisco',     title: 'Network Intern',    startYear: '2021', endYear: '2022' }],
    [{ company: 'NASA',      title: 'Research Intern',   startYear: '2019', endYear: '2020' }],
    [],
];

const seed = async () => {
    await connectDB();

    console.log('🌱 Starting seed...');

    const hashed = await bcrypt.hash('Password123', 12);

    let created = 0;
    let skipped = 0;

    for (let i = 0; i < 54; i++) {
        const firstName = firstNames[i];
        const lastName  = lastNames[i];
        const email     = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@aggieconnect.com`;

        // Skip if user already exists
        const existing = await User.findOne({ where: { email } });
        if (existing) {
            console.log(`⏭️  Skipped ${firstName} ${lastName} — already exists`);
            skipped++;
            continue;
        }

        const role     = i < 30 ? 'alumni' : 'student';
        const gradYear = role === 'alumni'
            ? 2010 + Math.floor(Math.random() * 13)
            : 2024 + Math.floor(Math.random() * 3);
        const position  = positions[Math.floor(Math.random() * positions.length)];
        const company   = role === 'alumni' ? companies[Math.floor(Math.random() * companies.length)] : null;
        const industry  = industries[Math.floor(Math.random() * industries.length)];
        const skills    = skillSets[Math.floor(Math.random() * skillSets.length)];
        const pastExp   = pastExperienceSets[Math.floor(Math.random() * pastExperienceSets.length)];

        // First 10 alumni are auto-accept bots
        const autoAccept = role === 'alumni' && i < 10;

        await User.create({
            firstName,
            lastName,
            email,
            password:       hashed,
            role,
            gradYear,
            position,
            company,
            industry,
            skills,
            pastExperience: pastExp,
            isApproved:     true,
            isAdmin:        false,
            autoAccept,
            bio: `${firstName} is a ${role === 'alumni'
                ? 'proud NC A&T alumni'
                : 'current NC A&T student'} in the Computer Science department.`,
        });

        console.log(`✅ Created ${firstName} ${lastName} ${autoAccept ? '🤖' : ''}`);
        created++;
    }

    console.log(`\n🎉 Seed complete! ${created} created, ${skipped} skipped.`);
    console.log(`🤖 First 10 alumni are auto-accept bots.`);
    process.exit(0);
};

seed().catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});