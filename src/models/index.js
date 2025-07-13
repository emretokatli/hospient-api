const { Sequelize } = require('sequelize');
const config = require('../config/database');

// Lazy load sequelize instance to avoid immediate database connection
let sequelize = null;
let models = null;

const getSequelize = () => {
  if (!sequelize) {
    try {
      // Ensure mysql2 is available
      require('mysql2');
      
      sequelize = new Sequelize(
        config.database,
        config.username,
        config.password,
        {
          host: config.host,
          dialect: 'mysql',
          dialectModule: require('mysql2'),
          logging: false,
          pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
          },
          retry: {
            max: 3
          }
        }
      );
    } catch (error) {
      console.error('Error initializing Sequelize:', error.message);
      // Return a mock sequelize instance for serverless environments
      sequelize = {
        authenticate: async () => {
          throw new Error('Database connection not available');
        },
        sync: async () => {
          console.log('Database sync skipped in serverless environment');
        }
      };
    }
  }
  return sequelize;
};

// Lazy load models to avoid immediate database connection
const loadModels = () => {
  if (!models) {
    try {
      const sequelizeInstance = getSequelize();
      
      models = {
        sequelize: sequelizeInstance,
        Member: require('./member.model')(sequelizeInstance),
        Guest: require('./guest.model')(sequelizeInstance),
        Organization: require('./organization.model')(sequelizeInstance),
        Hotel: require('./hotel.model')(sequelizeInstance),
        Room: require('./room.model')(sequelizeInstance),
        Restaurant: require('./restaurant.model')(sequelizeInstance),
        Menu: require('./menu.model')(sequelizeInstance),
        FileCategory: require('./file-category.model')(sequelizeInstance),
        File: require('./file.model')(sequelizeInstance),
        Images: require('./images.js')(sequelizeInstance),
        ConciergeCategory: require('./concierge_category.model')(sequelizeInstance),
        ConciergeRequest: require('./concierge_request.model')(sequelizeInstance),
        Offer: require('./offer.model')(sequelizeInstance),
        Communication: require('./communication.model')(sequelizeInstance),
        Meeting: require('./meeting.model')(sequelizeInstance),
        MeetingRoom: require('./meeting-room.model')(sequelizeInstance),
        WellnessSpa: require('./wellness-spa.model')(sequelizeInstance),
        HotelLandingPage: require('./hotel-landing-page.model')(sequelizeInstance),
        HotelSections: require('./hotel-sections.model')(sequelizeInstance),
        ChatMessage: require('./chat_message.model')(sequelizeInstance),
        Integration: require('./integration.model')(sequelizeInstance),
        IntegrationLog: require('./integration_log.model')(sequelizeInstance)
      };

      // Define relationships only if models loaded successfully
      if (models.Member && models.Organization) {
        models.Member.hasOne(models.Organization, { foreignKey: 'member_id' });
      }

      if (models.Organization && models.Hotel) {
        models.Organization.hasMany(models.Hotel, { foreignKey: 'organization_id' });
        models.Hotel.belongsTo(models.Organization, { foreignKey: 'organization_id' });
      }

      if (models.Hotel && models.Room) {
        models.Hotel.hasMany(models.Room, { foreignKey: 'hotel_id' });
        models.Room.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });
      }

      if (models.Hotel && models.Restaurant) {
        models.Hotel.hasMany(models.Restaurant, { foreignKey: 'hotel_id' });
        models.Restaurant.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });
      }

      if (models.Hotel && models.Menu) {
        models.Hotel.hasMany(models.Menu, { foreignKey: 'hotel_id' });
        models.Menu.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });
      }

      if (models.Restaurant && models.Menu) {
        models.Restaurant.hasMany(models.Menu, { foreignKey: 'restaurant_id' });
        models.Menu.belongsTo(models.Restaurant, { foreignKey: 'restaurant_id' });
      }

      // File relationships
      if (models.FileCategory && models.File) {
        models.FileCategory.hasMany(models.File, { foreignKey: 'category_id' });
        models.File.belongsTo(models.FileCategory, { foreignKey: 'category_id', as: 'category' });
      }

      if (models.Organization && models.File) {
        models.Organization.hasMany(models.File, { foreignKey: 'organization_id' });
        models.File.belongsTo(models.Organization, { foreignKey: 'organization_id' });
      }

      if (models.Hotel && models.File) {
        models.Hotel.hasMany(models.File, { foreignKey: 'hotel_id' });
        models.File.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });
      }

      if (models.File && models.Member) {
        models.File.belongsTo(models.Member, { foreignKey: 'member_id' });
      }

      if (models.Hotel && models.Images) {
        models.Hotel.hasMany(models.Images, { foreignKey: 'hotel_id' });
        models.Images.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });
      }

      if (models.Restaurant && models.Images) {
        models.Restaurant.hasMany(models.Images, { foreignKey: 'hotel_id' });
        models.Images.belongsTo(models.Restaurant, { foreignKey: 'hotel_id' });
      }

      // Concierge relationships
      if (models.ConciergeCategory && models.ConciergeRequest) {
        models.ConciergeCategory.hasMany(models.ConciergeRequest, {
          foreignKey: 'category_id',
        });
        models.ConciergeRequest.belongsTo(models.ConciergeCategory, {
          foreignKey: 'category_id',
        });
      }

      if (models.Hotel && models.ConciergeRequest) {
        models.Hotel.hasMany(models.ConciergeRequest, { foreignKey: 'hotel_id' });
        models.ConciergeRequest.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });
      }

      // Offer relationships
      if (models.Hotel && models.Offer) {
        models.Hotel.hasMany(models.Offer, { foreignKey: 'hotel_id' });
        models.Offer.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });
      }

      // Communication relationships
      if (models.Hotel && models.Communication) {
        models.Hotel.hasMany(models.Communication, { foreignKey: 'hotel_id' });
        models.Communication.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });
      }

      // Self-referencing relationship for chat replies
      if (models.Communication) {
        models.Communication.hasMany(models.Communication, { 
          foreignKey: 'response_to_id', 
          as: 'replies' 
        });
        models.Communication.belongsTo(models.Communication, { 
          foreignKey: 'response_to_id', 
          as: 'parent_message' 
        });
      }

      // Guest relationships
      if (models.Guest && models.ConciergeRequest) {
        models.Guest.hasMany(models.ConciergeRequest, { foreignKey: 'guest_id' });
        models.ConciergeRequest.belongsTo(models.Guest, { foreignKey: 'guest_id' });
      }

      // Meeting relationships
      if (models.Hotel && models.Meeting) {
        models.Hotel.hasMany(models.Meeting, { foreignKey: 'hotel_id' });
        models.Meeting.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });
      }

      // MeetingRoom relationships
      if (models.Hotel && models.MeetingRoom) {
        models.Hotel.hasMany(models.MeetingRoom, { foreignKey: 'hotel_id' });
        models.MeetingRoom.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });
      }

      if (models.Member && models.Meeting) {
        models.Member.hasMany(models.Meeting, { foreignKey: 'created_by' });
        models.Meeting.belongsTo(models.Member, { foreignKey: 'created_by', as: 'creator' });

        models.Member.hasMany(models.Meeting, { foreignKey: 'approved_by' });
        models.Meeting.belongsTo(models.Member, { foreignKey: 'approved_by', as: 'approver' });
      }

      // Wellness & Spa relationships
      if (models.Hotel && models.WellnessSpa) {
        models.Hotel.hasMany(models.WellnessSpa, { foreignKey: 'hotel_id' });
        models.WellnessSpa.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });
      }

      // Hotel Landing Page relationships
      if (models.Hotel && models.HotelLandingPage) {
        models.Hotel.hasMany(models.HotelLandingPage, { foreignKey: 'hotel_id' });
        models.HotelLandingPage.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });
      }

      // Chat Message relationships
      if (models.Hotel && models.ChatMessage) {
        models.Hotel.hasMany(models.ChatMessage, { foreignKey: 'hotel_id' });
        models.ChatMessage.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });
      }

      // Hotel Sections relationships
      if (models.Hotel && models.HotelSections) {
        models.Hotel.hasMany(models.HotelSections, { foreignKey: 'hotel_id' });
        models.HotelSections.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });
      }

      // Integration relationships
      if (models.Hotel && models.Integration) {
        models.Hotel.hasMany(models.Integration, { foreignKey: 'hotel_id' });
        models.Integration.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });
      }

      if (models.Member && models.Integration) {
        models.Member.hasMany(models.Integration, { foreignKey: 'created_by' });
        models.Integration.belongsTo(models.Member, { foreignKey: 'created_by', as: 'creator' });

        models.Member.hasMany(models.Integration, { foreignKey: 'updated_by' });
        models.Integration.belongsTo(models.Member, { foreignKey: 'updated_by', as: 'updater' });
      }

      // Integration Log relationships
      if (models.Integration && models.IntegrationLog) {
        models.Integration.hasMany(models.IntegrationLog, { foreignKey: 'integration_id' });
        models.IntegrationLog.belongsTo(models.Integration, { foreignKey: 'integration_id' });
      }

    } catch (error) {
      console.error('Error loading models:', error.message);
      // Return mock models for serverless environments
      models = {
        sequelize: getSequelize(),
        Member: null,
        Guest: null,
        Organization: null,
        Hotel: null,
        Room: null,
        Restaurant: null,
        Menu: null,
        FileCategory: null,
        File: null,
        Images: null,
        ConciergeCategory: null,
        ConciergeRequest: null,
        Offer: null,
        Communication: null,
        Meeting: null,
        MeetingRoom: null,
        WellnessSpa: null,
        HotelLandingPage: null,
        HotelSections: null,
        ChatMessage: null,
        Integration: null,
        IntegrationLog: null
      };
    }
  }
  return models;
};

// Export a function that returns models when called
module.exports = () => {
  return loadModels();
};

// Also export individual models as properties for backward compatibility
Object.defineProperty(module.exports, 'sequelize', {
  get: () => loadModels().sequelize
});

Object.defineProperty(module.exports, 'Member', {
  get: () => loadModels().Member
});

Object.defineProperty(module.exports, 'Guest', {
  get: () => loadModels().Guest
});

Object.defineProperty(module.exports, 'Organization', {
  get: () => loadModels().Organization
});

Object.defineProperty(module.exports, 'Hotel', {
  get: () => loadModels().Hotel
});

Object.defineProperty(module.exports, 'Room', {
  get: () => loadModels().Room
});

Object.defineProperty(module.exports, 'Restaurant', {
  get: () => loadModels().Restaurant
});

Object.defineProperty(module.exports, 'Menu', {
  get: () => loadModels().Menu
});

Object.defineProperty(module.exports, 'FileCategory', {
  get: () => loadModels().FileCategory
});

Object.defineProperty(module.exports, 'File', {
  get: () => loadModels().File
});

Object.defineProperty(module.exports, 'Images', {
  get: () => loadModels().Images
});

Object.defineProperty(module.exports, 'ConciergeCategory', {
  get: () => loadModels().ConciergeCategory
});

Object.defineProperty(module.exports, 'ConciergeRequest', {
  get: () => loadModels().ConciergeRequest
});

Object.defineProperty(module.exports, 'Offer', {
  get: () => loadModels().Offer
});

Object.defineProperty(module.exports, 'Communication', {
  get: () => loadModels().Communication
});

Object.defineProperty(module.exports, 'Meeting', {
  get: () => loadModels().Meeting
});

Object.defineProperty(module.exports, 'MeetingRoom', {
  get: () => loadModels().MeetingRoom
});

Object.defineProperty(module.exports, 'WellnessSpa', {
  get: () => loadModels().WellnessSpa
});

Object.defineProperty(module.exports, 'HotelLandingPage', {
  get: () => loadModels().HotelLandingPage
});

Object.defineProperty(module.exports, 'HotelSections', {
  get: () => loadModels().HotelSections
});

Object.defineProperty(module.exports, 'ChatMessage', {
  get: () => loadModels().ChatMessage
});

Object.defineProperty(module.exports, 'Integration', {
  get: () => loadModels().Integration
});

Object.defineProperty(module.exports, 'IntegrationLog', {
  get: () => loadModels().IntegrationLog
}); 