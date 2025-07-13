const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Swagger configuration
const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Hospient API - Simple Version',
    version: '1.0.0',
    description: 'Simple API for Hospient.com - No Database Dependencies',
  },
  servers: [
    {
      url: 'https://hospient-api.vercel.app',
      description: 'Production server',
    },
  ],
  paths: {
    '/api/simple': {
      get: {
        summary: 'Simple test endpoint',
        description: 'Basic endpoint without database dependencies',
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    message: { type: 'string' },
                    timestamp: { type: 'string' },
                    environment: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/health': {
      get: {
        summary: 'Health check',
        description: 'Check if the API is running',
        responses: {
          '200': {
            description: 'API is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    message: { type: 'string' },
                    timestamp: { type: 'string' },
                    environment: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

// Simple test endpoint
app.get('/api/simple', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Simple API is working without any database dependencies',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Simple Hospient API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Hospient API - Simple Version',
    endpoints: {
      simple: '/api/simple',
      health: '/api/health',
      docs: '/api-docs'
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