const express = require('express');
const router = express.Router();
const orderService = require('../services/orderService');

// POST /api/orders/checkout - Create order and reserve stock
router.post('/checkout', async (req, res) => {
  try {
    const { items, idempotencyKey } = req.body;
    const key = idempotencyKey || req.headers['x-idempotency-key'];
    const result = await orderService.createReservationAndOrder({ items, idempotencyKey: key });
    
    const statusCode = result.isDuplicateSubmission ? 200 : 201;
    res.status(statusCode).json({ success: true, ...result });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message || 'Checkout failed.' });
  }
});

// POST /api/orders/:id/cancel - Cancel order and restore stock
router.post('/:id/cancel', async (req, res) => {
  try {
    const result = await orderService.cancelOrder(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message || 'Order cancellation failed.' });
  }
});

// GET /api/orders - Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await orderService.getAllOrders();
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/orders/:id - Get order details
router.get('/:id', async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
