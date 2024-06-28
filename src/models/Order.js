const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('./index');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  table_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  product_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pendiente', 'finalizada'),
    defaultValue: 'pendiente'
  }
}, {
  tableName: 'orders',
  timestamps: true
});

module.exports = Order;
