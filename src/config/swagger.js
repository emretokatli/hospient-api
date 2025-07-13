const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hospient API',
      version: '1.0.0',
      description: 'API documentation for the Hospient - Includes both public endpoints (no auth) and protected endpoints (JWT auth)',
      contact: {
        name: 'Hospient Support',
        email: 'support@hospient.com'
      }
    },
    servers: [
      {
        url: 'https://hospient-api.vercel.app',
        description: 'Production server'
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://hospient-ka5pyrw9t-emretokatli-gmailcoms-projects.vercel.app',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec; 