const { Sequelize } = require('sequelize');
const config = require('../config/database');

// Lazy load sequelize instance
let sequelize = null;
let models = null;

const getSequelize = () => {
  if (!sequelize) {
    try {
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
          pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
          retry: { max: 3 }
        }
      );
    } catch (error) {
      console.error('Sequelize init error:', error.message);
      sequelize = {
        authenticate: async () => { throw new Error('DB not available'); },
        sync: async () => { console.log('DB sync skipped'); }
      };
    }
  }
  return sequelize;
};

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
    } catch (error) {
      console.error('Models load error:', error.message);
      models = {
        sequelize: getSequelize(),
        Member: null, Guest: null, Organization: null, Hotel: null,
        Room: null, Restaurant: null, Menu: null, FileCategory: null,
        File: null, Images: null, ConciergeCategory: null, ConciergeRequest: null,
        Offer: null, Communication: null, Meeting: null, MeetingRoom: null,
        WellnessSpa: null, HotelLandingPage: null, HotelSections: null,
        ChatMessage: null, Integration: null, IntegrationLog: null
      };
    }
  }
  return models;
};

module.exports = loadModels; 