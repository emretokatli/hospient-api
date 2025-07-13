require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { sequelize } = require('./models');
const { publicRateLimit, authRateLimit } = require('./middleware/rate-limit.middleware');
const NotificationWebSocketServer = require('./websocket/notificationServer');
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
const http = require('http');
const socketIo = require('socket.io');
const { ChatMessage, Hotel } = require('./models');

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

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

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

// Database connection and server start
sequelize.sync({ alter: false })
  .then(() => {
    console.log('Database connected successfully');
    const server = http.createServer(app);
    const io = socketIo(server, { cors: { origin: '*' } });

    // Make io globally available for chat routes
    global.io = io;

    io.on('connection', (socket) => {
      const { user, room: slug } = socket.handshake.query;
      
      // Join room based on user email (required)
      if (user) {
        socket.join(`user:${user}`);
      }
      
      // Join room based on hotel slug (optional)
      if (slug) {
        socket.join(`hotel:${slug}`);
      }

      socket.on('chat message', async (msg) => {
        // Validate required fields
        if (!msg.user) {
          console.error('Chat message missing required user email');
          return;
        }
        
        let hotel_id = null;
        let hotel_slug = null;
        
        // If hotel_id is provided directly, use it
        if (msg.hotel_id) {
          hotel_id = msg.hotel_id;
          hotel_slug = msg.hotel_slug || null;
        }
        // Otherwise, look up hotel by slug
        else if (msg.hotel_slug) {
          try {
            const hotel = await Hotel.findOne({ where: { hotel_slug: msg.hotel_slug } });
            if (hotel) {
              hotel_id = hotel.id;
              hotel_slug = msg.hotel_slug;
            } else {
              console.warn(`Hotel not found for slug: ${msg.hotel_slug}`);
            }
          } catch (error) {
            console.error('Error finding hotel:', error);
          }
        }
        
        try {
          // Save to DB
          const message = await ChatMessage.create({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            hotel_id,
            hotel_slug,
            room: msg.room_number || null,
            user: msg.user, // user (email) is required
            text: msg.text,
            createdAt: new Date(),
          });
          
          // Broadcast to user's room
          io.to(`user:${msg.user}`).emit('chat message', message);
          
          // Broadcast to hotel room if hotel slug is provided
          if (hotel_slug) {
            io.to(`hotel:${hotel_slug}`).emit('chat message', message);
          }
        } catch (error) {
          console.error('Error saving chat message:', error);
        }
      });
    });

    // Initialize WebSocket server for real-time notifications
    const notificationWebSocketServer = new NotificationWebSocketServer(server);
    
    // Make WebSocket server available globally for communication routes
    global.notificationWebSocketServer = notificationWebSocketServer;
    
    console.log('WebSocket notification server initialized');

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((error) => {
    console.error('Unable to connect to the database:', error);
  }); 