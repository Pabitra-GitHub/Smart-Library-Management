const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./src/routes/api');
const settings = require('./src/config/settings');

const app = express();
const PORT = settings.port || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Mount API routes
app.use('/api', apiRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// SPA fallback: Return index.html for any unmatched client routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` 📚 AI SMART LIBRARY MANAGEMENT SYSTEM (B.Tech Minor)`);
    console.log(` Server is running on: http://localhost:${PORT}`);
    console.log(` 🚀 System initialized in clean production-ready mode`);
    console.log(` 🔑 Librarian Master Key: admin123 (for creating admin accounts)`);
    console.log(`====================================================`);
  });
}

module.exports = app;
