const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('./index');

const Log = sequelize.define('Log', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'ID'
    }
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'logs',
  timestamps: true
});

module.exports = Log;
