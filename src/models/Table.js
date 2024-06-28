const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('./index');

const Table = sequelize.define('Table', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  number: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('libre', 'con_ordenes', 'ocupada'),
    defaultValue: 'libre'
  },
  floor: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'tables',
  timestamps: true
});

module.exports = Table;
