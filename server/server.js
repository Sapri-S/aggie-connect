require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const { connectDB } = require('./src/config/db');
const { apiLimiter } = require('./src/middleware/rateLimiter');

const authRoutes       = require('./src/routes/auth');
const userRoutes       = require('./src/routes/users');
const connectionRoutes = require('./src/routes/connections');
const adminRoutes      = require('./src/routes/admin');
const uploadRoutes     = require('./src/routes/upload');
const errorHandler     = require('./src/middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.CLIENT_URL
        : 'http://localhost:5173',
    credentials: true,
}));

// ── General Middleware ────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // limit body size
app.use('/api', apiLimiter);              // rate limit all API routes

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/users',       userRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/admin',       adminRoutes);
app.use('/api/upload',      uploadRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ── Error handler (must be last) ──────────────────────────────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
const start = async () => {
    await connectDB();
    app.listen(PORT, () => console.log(`🟢 Server running on http://localhost:${PORT}`));
};

start();