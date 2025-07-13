const { Sequelize } = require('sequelize');
const config = require('../config/database');

// Lazy load sequelize instance to avoid immediate database connection
let sequelize = null;

const getSequelize = () => {
  if (!sequelize) {
    sequelize = new Sequelize(
      config.database,
      config.username,
      config.password,
      {
        host: config.host,
        dialect: 'mysql',
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
  }
  return sequelize;
};

// Lazy load models to avoid immediate database connection
let models = {};

const loadModels = () => {
  if (Object.keys(models).length === 0) {
    const sequelizeInstance = getSequelize();
    
    models.Member = require('./member.model')(sequelizeInstance);
    models.Guest = require('./guest.model')(sequelizeInstance);
    models.Organization = require('./organization.model')(sequelizeInstance);
    models.Hotel = require('./hotel.model')(sequelizeInstance);
    models.Room = require('./room.model')(sequelizeInstance);
    models.Restaurant = require('./restaurant.model')(sequelizeInstance);
    models.Menu = require('./menu.model')(sequelizeInstance);
    models.FileCategory = require('./file-category.model')(sequelizeInstance);
    models.File = require('./file.model')(sequelizeInstance);
    models.Images = require('./images.js')(sequelizeInstance);
    models.ConciergeCategory = require('./concierge_category.model')(sequelizeInstance);
    models.ConciergeRequest = require('./concierge_request.model')(sequelizeInstance);
    models.Offer = require('./offer.model')(sequelizeInstance);
    models.Communication = require('./communication.model')(sequelizeInstance);
    models.Meeting = require('./meeting.model')(sequelizeInstance);
    models.MeetingRoom = require('./meeting-room.model')(sequelizeInstance);
    models.WellnessSpa = require('./wellness-spa.model')(sequelizeInstance);
    models.HotelLandingPage = require('./hotel-landing-page.model')(sequelizeInstance);
    models.HotelSections = require('./hotel-sections.model')(sequelizeInstance);
    models.ChatMessage = require('./chat_message.model')(sequelizeInstance);
    models.Integration = require('./integration.model')(sequelizeInstance);
    models.IntegrationLog = require('./integration_log.model')(sequelizeInstance);

    // Define relationships
    models.Member.hasOne(models.Organization, { foreignKey: 'member_id' });

    models.Organization.hasMany(models.Hotel, { foreignKey: 'organization_id' });
    models.Hotel.belongsTo(models.Organization, { foreignKey: 'organization_id' });

    models.Hotel.hasMany(models.Room, { foreignKey: 'hotel_id' });
    models.Room.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });

    models.Hotel.hasMany(models.Restaurant, { foreignKey: 'hotel_id' });
    models.Restaurant.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });

    models.Hotel.hasMany(models.Menu, { foreignKey: 'hotel_id' });
    models.Menu.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });

    models.Restaurant.hasMany(models.Menu, { foreignKey: 'restaurant_id' });
    models.Menu.belongsTo(models.Restaurant, { foreignKey: 'restaurant_id' });

    // File relationships
    models.FileCategory.hasMany(models.File, { foreignKey: 'category_id' });
    models.File.belongsTo(models.FileCategory, { foreignKey: 'category_id', as: 'category' });

    models.Organization.hasMany(models.File, { foreignKey: 'organization_id' });
    models.File.belongsTo(models.Organization, { foreignKey: 'organization_id' });

    models.Hotel.hasMany(models.File, { foreignKey: 'hotel_id' });
    models.File.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });

    models.File.belongsTo(models.Member, { foreignKey: 'member_id' });

    models.Hotel.hasMany(models.Images, { foreignKey: 'hotel_id' });
    models.Images.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });

    models.Restaurant.hasMany(models.Images, { foreignKey: 'hotel_id' });
    models.Images.belongsTo(models.Restaurant, { foreignKey: 'hotel_id' });

    // Concierge relationships
    models.ConciergeCategory.hasMany(models.ConciergeRequest, {
      foreignKey: 'category_id',
    });
    models.ConciergeRequest.belongsTo(models.ConciergeCategory, {
      foreignKey: 'category_id',
    });

    models.Hotel.hasMany(models.ConciergeRequest, { foreignKey: 'hotel_id' });
    models.ConciergeRequest.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });

    // Offer relationships
    models.Hotel.hasMany(models.Offer, { foreignKey: 'hotel_id' });
    models.Offer.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });

    // Communication relationships
    models.Hotel.hasMany(models.Communication, { foreignKey: 'hotel_id' });
    models.Communication.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });

    // Self-referencing relationship for chat replies
    models.Communication.hasMany(models.Communication, { 
      foreignKey: 'response_to_id', 
      as: 'replies' 
    });
    models.Communication.belongsTo(models.Communication, { 
      foreignKey: 'response_to_id', 
      as: 'parent_message' 
    });

    // Guest relationships
    models.Guest.hasMany(models.ConciergeRequest, { foreignKey: 'guest_id' });
    models.ConciergeRequest.belongsTo(models.Guest, { foreignKey: 'guest_id' });

    // Meeting relationships
    models.Hotel.hasMany(models.Meeting, { foreignKey: 'hotel_id' });
    models.Meeting.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });

    // MeetingRoom relationships
    models.Hotel.hasMany(models.MeetingRoom, { foreignKey: 'hotel_id' });
    models.MeetingRoom.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });

    models.Member.hasMany(models.Meeting, { foreignKey: 'created_by' });
    models.Meeting.belongsTo(models.Member, { foreignKey: 'created_by', as: 'creator' });

    models.Member.hasMany(models.Meeting, { foreignKey: 'approved_by' });
    models.Meeting.belongsTo(models.Member, { foreignKey: 'approved_by', as: 'approver' });

    // Wellness & Spa relationships
    models.Hotel.hasMany(models.WellnessSpa, { foreignKey: 'hotel_id' });
    models.WellnessSpa.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });

    // Hotel Landing Page relationships
    models.Hotel.hasMany(models.HotelLandingPage, { foreignKey: 'hotel_id' });
    models.HotelLandingPage.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });

    // Chat Message relationships
    models.Hotel.hasMany(models.ChatMessage, { foreignKey: 'hotel_id' });
    models.ChatMessage.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });

    // Hotel Sections relationships
    models.Hotel.hasMany(models.HotelSections, { foreignKey: 'hotel_id' });
    models.HotelSections.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });

    // Integration relationships
    models.Hotel.hasMany(models.Integration, { foreignKey: 'hotel_id' });
    models.Integration.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });

    models.Member.hasMany(models.Integration, { foreignKey: 'created_by' });
    models.Integration.belongsTo(models.Member, { foreignKey: 'created_by', as: 'creator' });

    models.Member.hasMany(models.Integration, { foreignKey: 'updated_by' });
    models.Integration.belongsTo(models.Member, { foreignKey: 'updated_by', as: 'updater' });

    // Integration Log relationships
    models.Integration.hasMany(models.IntegrationLog, { foreignKey: 'integration_id' });
    models.IntegrationLog.belongsTo(models.Integration, { foreignKey: 'integration_id' });
  }
  return models;
};

// Export individual models with lazy loading
const createModelExports = () => {
  const models = loadModels();
  return {
    sequelize: getSequelize(),
    Member: models.Member,
    Guest: models.Guest,
    Organization: models.Organization,
    Hotel: models.Hotel,
    Room: models.Room,
    Restaurant: models.Restaurant,
    Menu: models.Menu,
    FileCategory: models.FileCategory,
    File: models.File,
    Images: models.Images,
    ConciergeCategory: models.ConciergeCategory,
    ConciergeRequest: models.ConciergeRequest,
    Offer: models.Offer,
    Communication: models.Communication,
    Meeting: models.Meeting,
    MeetingRoom: models.MeetingRoom,
    WellnessSpa: models.WellnessSpa,
    HotelLandingPage: models.HotelLandingPage,
    HotelSections: models.HotelSections,
    ChatMessage: models.ChatMessage,
    Integration: models.Integration,
    IntegrationLog: models.IntegrationLog
  };
};

module.exports = createModelExports(); 