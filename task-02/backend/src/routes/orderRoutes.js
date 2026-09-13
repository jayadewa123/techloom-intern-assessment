const express = require('express');
const router = express.Router();
const orderService = require('../services/orderService');

// POST /api/orders/checkout - Reserve stock and initiate checkout
router.post('/checkout', async (req, res) => {
  try {
    const { items, idempotencyKey } = req.body;
    const key = idempotencyKey || req.headers['x-idempotency-key'];
    const result = await orderService.createReservationAndOrder({ items, idempotencyKey: key });
    
    res.status(result.isDuplicateSubmission ? 200 : 201).json({ success: true, ...result });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message || 'Checkout failed.' });
  }
});

// POST /api/orders/:id/cancel-refund - Cancel order and simulate refund
router.post('/:id/cancel-refund', async (req, res) => {
  try {
    const { reason } = req.body;
    const result = await orderService.cancelAndRefundOrder(req.params.id, reason);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message || 'Refund/cancellation failed.' });
  }
});

// GET /api/orders - Get order history
router.get('/', async (req, res) => {
  try {
    const orders = await orderService.getAllOrders();
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
