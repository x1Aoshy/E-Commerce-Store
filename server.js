const express = require('express');
const cors = require('cors');
const path = require('path');
const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Product = require('./src/models/Product');
const User = require('./src/models/User');
const Log = require('./src/models/Log');
const Order = require('./src/models/Order');
const Table = require('./src/models/Table');
const Earning = require('./src/models/Earning');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = 'mi_clave_secreta_segura'; // Definir la clave secreta directamente

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

// Database connection
const sequelize = new Sequelize('restaurant', 'restaurant', 'admin22$', {
  host: 'localhost',
  dialect: 'mysql'
});

// Test database connection
sequelize.authenticate()
  .then(() => console.log('Connection has been established successfully.'))
  .catch(err => console.error('Unable to connect to the database:', err));

// Sync models
sequelize.sync()
  .then(() => console.log('Database & tables created!'))
  .catch(err => console.error('Error creating database & tables:', err));

// Authentication Middleware
const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  if (token) {
    jwt.verify(token, SECRET_KEY, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// User Login Route
app.post('/api/users/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { username } });
    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
      res.json({ token, role: user.role });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Routes
app.get('/api/products', authenticateJWT, async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', authenticateJWT, async (req, res) => {
  const { name, description, price } = req.body;
  try {
    const product = await Product.create({ name, description, price });
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/products/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { name, description, price } = req.body;
  try {
    const product = await Product.findByPk(id);
    if (product) {
      product.name = name;
      product.description = description;
      product.price = price;
      await product.save();
      res.status(200).json(product);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/products/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findByPk(id);
    if (product) {
      await product.destroy();
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Add similar routes for /api/users, /api/earnings, /api/orders, and /api/logs with authenticateJWT middleware

// Catch all route for serving the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
