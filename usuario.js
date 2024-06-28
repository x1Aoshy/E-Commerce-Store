const bcrypt = require('bcrypt');
const { Sequelize, DataTypes } = require('sequelize');

// Configuración de la base de datos
const sequelize = new Sequelize('restaurant', 'restaurant', 'admin22$', {
  host: 'localhost',
  dialect: 'mysql'
});

// Definición del modelo de usuario
const User = sequelize.define('user', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'users', // Asegurarse de que utiliza la tabla 'users'
  timestamps: false // Deshabilitar timestamps automáticos
});

// Función para crear un nuevo usuario
const createUser = async (username, plainPassword, role) => {
  try {
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    await User.create({ username, password: hashedPassword, role });
    console.log(`Usuario ${username} creado con éxito.`);
  } catch (error) {
    console.error('Error al crear el usuario:', error);
  }
};

// Crear el usuario Aoshy con contraseña Chang
createUser('Aoshy2', 'Chang', 'Admin');
