require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
// Use lazy-loaded models to avoid immediate database connection
const loadModels = require('./models/lazy-models');
const { publicRateLimit, authRateLimit } = require('./middleware/rate-limit.middleware');
// Remove WebSocket server import for serverless compatibility
// const NotificationWebSocketServer = require('./websocket/notificationServer');
const authRoutes = require('./routes/auth.routes');
const guestAuthRoutes = require('./routes/guest.auth.routes');
const guestRoutes = require('./routes/guest.routes');
const memberRoutes = require('./routes/member.routes');
const organizationRoutes = require('./routes/organization.routes');
const hotelRoutes = require('./routes/hotel.routes');
const roomRoutes = require('./routes/room.routes');
const restaurantRoutes = require('./routes/restaurant.routes');
const menuRoutes = require('./routes/menu.routes');
const fileCategoryRoutes = require('./routes/file-category.routes');
const fileRoutes = require('./routes/file.routes');
const imageRoutes = require('./routes/images.js');
const path = require('path');
const conciergeRoutes = require('./routes/concierge');
const offerRoutes = require('./routes/offer.routes');
const communicationRoutes = require('./routes/communication.routes');
const dashboardRoutes = require('./routes/dashboard');
const meetingRoutes = require('./routes/meeting.route');
const meetingRoomRoutes = require('./routes/meeting-room.route');
const wellnessSpaRoutes = require('./routes/wellness-spa.route');
const hotelLandingPageRoutes = require('./routes/hotel-landing-page.route');
const hotelSectionsRoutes = require('./routes/hotel-sections.route');
const chatRoutes = require('./routes/chat.routes');
const integrationRoutes = require('./routes/integration.routes');
const webhookRoutes = require('./routes/webhook.routes');
// Remove HTTP and Socket.io imports for serverless compatibility
// const http = require('http');
// const socketIo = require('socket.io');
// Remove model imports to avoid immediate database connection
// const { ChatMessage, Hotel } = require('./models');

// Public routes (no authentication required)
const publicHotelRoutes = require('./routes/public.hotel.routes');
const publicRestaurantRoutes = require('./routes/public.restaurant.routes');
const publicMenuRoutes = require('./routes/public.menu.routes');
const publicRoomRoutes = require('./routes/public.room.routes');
const publicMeetingRoutes = require('./routes/public.meeting.route');
const publicMeetingRoomRoutes = require('./routes/public.meeting-room.route');
const publicWellnessSpaRoutes = require('./routes/public.wellness-spa.route');
const publicHotelLandingPageRoutes = require('./routes/public.hotel-landing-page.route');
const publicHotelSectionsRoutes = require('./routes/public.hotel-sections.route');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (Note: Vercel has read-only filesystem)
// app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

// Add a simple test endpoint that doesn't require database
app.get('/api/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API is working without database connection',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mysql2: 'Available (not tested)',
    sequelize: 'Available (not tested)'
  });
});

// Add a health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Hospient API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Add a debug endpoint for troubleshooting
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

// Public routes (no authentication required) - for Customer-UI
app.use('/api/public/hotels', publicRateLimit, publicHotelRoutes);
app.use('/api/public/restaurants', publicRateLimit, publicRestaurantRoutes);
app.use('/api/public/menus', publicRateLimit, publicMenuRoutes);
app.use('/api/public/rooms', publicRateLimit, publicRoomRoutes);
app.use('/api/public/meetings', publicRateLimit, publicMeetingRoutes);
app.use('/api/public/meeting-rooms', publicRateLimit, publicMeetingRoomRoutes);
app.use('/api/public/wellness-spa', publicRateLimit, publicWellnessSpaRoutes);
app.use('/api/public/hotel-landing-pages', publicRateLimit, publicHotelLandingPageRoutes);
app.use('/api/public/hotel-sections', publicRateLimit, publicHotelSectionsRoutes);
app.use('/api/chat', publicRateLimit, chatRoutes);

// Guest authentication routes - for App users
app.use('/api/guest/auth', publicRateLimit, guestAuthRoutes);

// Guest management routes - for Admin panel
app.use('/api/guests', guestRoutes);

// Protected routes (authentication required) - for Backoffice Admin
app.use('/api/auth', authRateLimit, authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/file-categories', fileCategoryRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/concierge', conciergeRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/meeting-rooms', meetingRoomRoutes);
app.use('/api/wellness-spa', wellnessSpaRoutes);
app.use('/api/hotel-landing-pages', hotelLandingPageRoutes);
app.use('/api/hotel-sections', hotelSectionsRoutes);
app.use('/api/chat', chatRoutes);

// Integration routes (authentication required)
app.use('/api/integrations', integrationRoutes);

// Webhook routes (no authentication required - uses signature validation)
app.use('/api/webhooks', webhookRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Handle specific known errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Validation error',
      errors: err.errors
    });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Database validation error',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 3000;

// Database connection and server start - Modified for serverless
const startServer = async () => {
  try {
    // Only try to connect to database if we're not in serverless environment
    if (!process.env.VERCEL) {
      const models = loadModels();
      // Test database connection
      await models.sequelize.authenticate();
      console.log('Database connected successfully');
      
      // Sync database (be careful with alter: true in production)
      await models.sequelize.sync({ alter: false });
      console.log('Database synced successfully');
    }
    
    // For serverless deployment, we don't start a server
    // Vercel will handle the serverless function
    console.log('Serverless function ready');
    
  } catch (error) {
    console.error('Database connection failed:', error);
    console.log('API will continue without database connection');
    // Don't exit process - allow API to work for basic endpoints
    // process.exit(1);
  }
};

// Start the server only if not in serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  startServer().then(() => {
    const server = require('http').createServer(app);
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
} else {
  // For Vercel serverless, just initialize the database connection
  startServer();
}

// Export the app for Vercel
module.exports = app; 