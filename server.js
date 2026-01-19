require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const proposalRoutes = require('./backend/routes/proposalRoutes');

const app = express();

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', proposalRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', version: '3.0' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large', details: 'Maximum file size is 10MB' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files', details: 'Maximum 5 files allowed' });
    }
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Campus Connect v3.0 Server running on port ${PORT}`);
});
