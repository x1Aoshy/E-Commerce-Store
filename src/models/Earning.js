const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('./index');

const Earning = sequelize.define('Earning', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  month: {
    type: DataTypes.STRING,
    allowNull: false
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  tableName: 'earnings',
  timestamps: true
});

module.exports = Earning;
