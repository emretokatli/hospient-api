const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API is working without any database dependencies',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mysql2: 'Not tested',
    sequelize: 'Not tested'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Hospient API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Debug endpoint
app.get('/api/debug', (req, res) => {
  res.json({
    status: 'debug',
    environment: process.env.NODE_ENV || 'development',
    database: {
      host: process.env.DB_HOST ? 'SET' : 'NOT SET',
      port: process.env.DB_PORT ? 'SET' : 'NOT SET',
      name: process.env.DB_NAME ? 'SET' : 'NOT SET',
      user: process.env.DB_USER ? 'SET' : 'NOT SET',
      password: process.env.DB_PASSWORD ? 'SET' : 'NOT SET'
    },
    jwt: {
      secret: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
      expires: process.env.JWT_EXPIRES_IN || 'NOT SET'
    },
    cors: {
      origin: process.env.CORS_ORIGIN || 'NOT SET'
    },
    vercel: {
      isVercel: !!process.env.VERCEL,
      functionName: process.env.VERCEL_FUNCTION_NAME || 'NOT SET'
    },
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error'
  });
});

module.exports = app; 