const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');

// POST /api/payments/process - Process mock payment
router.post('/process', async (req, res) => {
  try {
    const { orderId, outcome, idempotencyKey } = req.body;
    const key = idempotencyKey || req.headers['x-idempotency-key'];
    
    const result = await paymentService.processPayment({
      orderId,
      outcome,
      idempotencyKey: key
    });

    const statusCode = result.isDuplicate ? 200 : 200;
    res.status(statusCode).json({ success: true, ...result });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message || 'Payment processing failed.' });
  }
});

module.exports = router;
