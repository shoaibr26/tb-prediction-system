const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const predictRoutes = require('./routes/predict');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/predict', predictRoutes);

// Simple health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
