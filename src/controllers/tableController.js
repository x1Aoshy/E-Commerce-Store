const Table = require('../models/Table');
const Order = require('../models/Order');

const getTables = async (req, res) => {
    try {
        const tables = await Table.findAll();
        res.status(200).json(tables);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const updateTableStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await Table.update({ status }, { where: { id } });
        res.status(200).json({ message: 'Table status updated' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const createOrder = async (req, res) => {
    const { id } = req.params;
    const { product_name, quantity } = req.body;
    try {
        await Order.create({ table_id: id, product_name, quantity });
        await Table.update({ status: 'con_ordenes' }, { where: { id } });
        res.status(201).json({ message: 'Order created' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const completeOrder = async (req, res) => {
    const { id } = req.params;
    try {
        await Order.update({ status: 'finalizada' }, { where: { id } });
        res.status(200).json({ message: 'Order completed' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const completeTable = async (req, res) => {
    const { id } = req.params;
    try {
        await Table.update({ status: 'libre' }, { where: { id } });
        await Order.update({ status: 'finalizada' }, { where: { table_id: id } });
        res.status(200).json({ message: 'Table completed' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = { getTables, updateTableStatus, createOrder, completeOrder, completeTable };
