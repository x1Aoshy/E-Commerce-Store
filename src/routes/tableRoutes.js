const express = require('express');
const { getTables, updateTableStatus, createOrder, completeOrder, completeTable } = require('../controllers/tableController');

const router = express.Router();

router.get('/', getTables);
router.patch('/:id/status', updateTableStatus);
router.post('/:id/orders', createOrder);
router.patch('/orders/:id/complete', completeOrder);
router.patch('/:id/complete', completeTable);

module.exports = router;
