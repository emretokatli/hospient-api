require('dotenv').config();

module.exports = {
  database: process.env.DB_NAME || 'dbs14426978',
  username: process.env.DB_USER || 'dbu1445585',
  password: process.env.DB_PASSWORD || 'BJK1903bjk1903!!',
  host: process.env.DB_HOST || 'database-5018207746.webspace-host.com',
  dialect: 'mysql',
  port: process.env.DB_PORT || 3306,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false
}; 