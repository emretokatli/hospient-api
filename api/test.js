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
    title: 'Hospient API',
    version: '1.0.0',
    description: 'API for Hospient.com - Hotel Management System',
  },
  servers: [
    {
      url: 'https://hospient-api.vercel.app',
      description: 'Production server',
    },
  ],
  paths: {
    '/api/test': {
      get: {
        summary: 'Test endpoint',
        description: 'Simple test endpoint to verify API is working',
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
                    environment: { type: 'string' },
                    mysql2: { type: 'string' },
                    sequelize: { type: 'string' }
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
    },
    '/api/debug': {
      get: {
        summary: 'Debug information',
        description: 'Get debug information about environment variables and configuration',
        responses: {
          '200': {
            description: 'Debug information',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    environment: { type: 'string' },
                    database: {
                      type: 'object',
                      properties: {
                        host: { type: 'string' },
                        port: { type: 'string' },
                        name: { type: 'string' },
                        user: { type: 'string' },
                        password: { type: 'string' }
                      }
                    },
                    jwt: {
                      type: 'object',
                      properties: {
                        secret: { type: 'string' },
                        expires: { type: 'string' }
                      }
                    },
                    cors: {
                      type: 'object',
                      properties: {
                        origin: { type: 'string' }
                      }
                    },
                    vercel: {
                      type: 'object',
                      properties: {
                        isVercel: { type: 'boolean' },
                        functionName: { type: 'string' }
                      }
                    },
                    timestamp: { type: 'string' }
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