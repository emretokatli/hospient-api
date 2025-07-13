const { Sequelize } = require('sequelize');
const config = require('../config/database');

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: 'mysql',
    logging: false,
  }
);

const Member = require('./member.model')(sequelize);
const Guest = require('./guest.model')(sequelize);
const Organization = require('./organization.model')(sequelize);
const Hotel = require('./hotel.model')(sequelize);
const Room = require('./room.model')(sequelize);
const Restaurant = require('./restaurant.model')(sequelize);
const Menu = require('./menu.model')(sequelize);
const FileCategory = require('./file-category.model')(sequelize);
const File = require('./file.model')(sequelize);
const Images = require('./images.js')(sequelize);
const ConciergeCategory = require('./concierge_category.model')(sequelize);
const ConciergeRequest = require('./concierge_request.model')(sequelize);
const Offer = require('./offer.model')(sequelize);
const Communication = require('./communication.model')(sequelize);
const Meeting = require('./meeting.model')(sequelize);
const MeetingRoom = require('./meeting-room.model')(sequelize);
const WellnessSpa = require('./wellness-spa.model')(sequelize);
const HotelLandingPage = require('./hotel-landing-page.model')(sequelize);
const HotelSections = require('./hotel-sections.model')(sequelize);
const ChatMessage = require('./chat_message.model')(sequelize);
const Integration = require('./integration.model')(sequelize);
const IntegrationLog = require('./integration_log.model')(sequelize);

// Define relationships
Member.hasOne(Organization, { foreignKey: 'member_id' });

Organization.hasMany(Hotel, { foreignKey: 'organization_id' });
Hotel.belongsTo(Organization, { foreignKey: 'organization_id' });

Hotel.hasMany(Room, { foreignKey: 'hotel_id' });
Room.belongsTo(Hotel, { foreignKey: 'hotel_id' });

Hotel.hasMany(Restaurant, { foreignKey: 'hotel_id' });
Restaurant.belongsTo(Hotel, { foreignKey: 'hotel_id' });

Hotel.hasMany(Menu, { foreignKey: 'hotel_id' });
Menu.belongsTo(Hotel, { foreignKey: 'hotel_id' });

Restaurant.hasMany(Menu, { foreignKey: 'restaurant_id' });
Menu.belongsTo(Restaurant, { foreignKey: 'restaurant_id' });

// File relationships
FileCategory.hasMany(File, { foreignKey: 'category_id' });
File.belongsTo(FileCategory, { foreignKey: 'category_id', as: 'category' });

Organization.hasMany(File, { foreignKey: 'organization_id' });
File.belongsTo(Organization, { foreignKey: 'organization_id' });

Hotel.hasMany(File, { foreignKey: 'hotel_id' });
File.belongsTo(Hotel, { foreignKey: 'hotel_id' });

File.belongsTo(Member, { foreignKey: 'member_id' });

Hotel.hasMany(Images, { foreignKey: 'hotel_id' });
Images.belongsTo(Hotel, { foreignKey: 'hotel_id' });

Restaurant.hasMany(Images, { foreignKey: 'hotel_id' });
Images.belongsTo(Restaurant, { foreignKey: 'hotel_id' });

// Concierge relationships
ConciergeCategory.hasMany(ConciergeRequest, {
  foreignKey: 'category_id',
});
ConciergeRequest.belongsTo(ConciergeCategory, {
  foreignKey: 'category_id',
});

Hotel.hasMany(ConciergeRequest, { foreignKey: 'hotel_id' });
ConciergeRequest.belongsTo(Hotel, { foreignKey: 'hotel_id' });

// Offer relationships
Hotel.hasMany(Offer, { foreignKey: 'hotel_id' });
Offer.belongsTo(Hotel, { foreignKey: 'hotel_id' });

// Communication relationships
Hotel.hasMany(Communication, { foreignKey: 'hotel_id' });
Communication.belongsTo(Hotel, { foreignKey: 'hotel_id' });

// Self-referencing relationship for chat replies
Communication.hasMany(Communication, { 
  foreignKey: 'response_to_id', 
  as: 'replies' 
});
Communication.belongsTo(Communication, { 
  foreignKey: 'response_to_id', 
  as: 'parent_message' 
});

// Guest relationships
Guest.hasMany(ConciergeRequest, { foreignKey: 'guest_id' });
ConciergeRequest.belongsTo(Guest, { foreignKey: 'guest_id' });

// Meeting relationships
Hotel.hasMany(Meeting, { foreignKey: 'hotel_id' });
Meeting.belongsTo(Hotel, { foreignKey: 'hotel_id' });

// MeetingRoom relationships
Hotel.hasMany(MeetingRoom, { foreignKey: 'hotel_id' });
MeetingRoom.belongsTo(Hotel, { foreignKey: 'hotel_id' });

Member.hasMany(Meeting, { foreignKey: 'created_by' });
Meeting.belongsTo(Member, { foreignKey: 'created_by', as: 'creator' });

Member.hasMany(Meeting, { foreignKey: 'approved_by' });
Meeting.belongsTo(Member, { foreignKey: 'approved_by', as: 'approver' });

// Wellness & Spa relationships
Hotel.hasMany(WellnessSpa, { foreignKey: 'hotel_id' });
WellnessSpa.belongsTo(Hotel, { foreignKey: 'hotel_id' });

// Hotel Landing Page relationships
Hotel.hasMany(HotelLandingPage, { foreignKey: 'hotel_id' });
HotelLandingPage.belongsTo(Hotel, { foreignKey: 'hotel_id' });

// Chat Message relationships
Hotel.hasMany(ChatMessage, { foreignKey: 'hotel_id' });
ChatMessage.belongsTo(Hotel, { foreignKey: 'hotel_id' });

// Hotel Sections relationships
Hotel.hasMany(HotelSections, { foreignKey: 'hotel_id' });
HotelSections.belongsTo(Hotel, { foreignKey: 'hotel_id' });

// Integration relationships
Hotel.hasMany(Integration, { foreignKey: 'hotel_id' });
Integration.belongsTo(Hotel, { foreignKey: 'hotel_id' });

Member.hasMany(Integration, { foreignKey: 'created_by' });
Integration.belongsTo(Member, { foreignKey: 'created_by', as: 'creator' });

Member.hasMany(Integration, { foreignKey: 'updated_by' });
Integration.belongsTo(Member, { foreignKey: 'updated_by', as: 'updater' });

// Integration Log relationships
Integration.hasMany(IntegrationLog, { foreignKey: 'integration_id' });
IntegrationLog.belongsTo(Integration, { foreignKey: 'integration_id' });

module.exports = {
  sequelize,
  Member,
  Guest,
  Organization,
  Hotel,
  Room,
  Restaurant,
  Menu,
  FileCategory,
  File,
  Images,
  ConciergeCategory,
  ConciergeRequest,
  Offer,
  Communication,
  Meeting,
  MeetingRoom,
  WellnessSpa,
  HotelLandingPage,
  HotelSections,
  ChatMessage,
  Integration,
  IntegrationLog
}; 