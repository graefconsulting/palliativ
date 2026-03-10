require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const shiftRoutes = require('./src/routes/shiftRoutes');
const shiftSettingsRoutes = require('./src/routes/shiftSettingsRoutes');
const holidaysRoutes = require('./src/routes/holidaysRoutes');
const requestRoutes = require('./src/routes/requestRoutes');
const timeRoutes = require('./src/routes/timeRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/shift-settings', shiftSettingsRoutes);
app.use('/api/holidays', holidaysRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/time', timeRoutes);

// Basic Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Palliativteam API läuft' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});
