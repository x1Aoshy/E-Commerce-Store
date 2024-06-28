const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('restaurant', 'restaurant', 'admin22$', {
  host: 'localhost',
  dialect: 'mysql'
});

module.exports = sequelize;
