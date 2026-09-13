const db = require('../config/db');

class PaymentService {
  /**
   * Process Mock Payment for an Order
   * Outcome: SUCCESS, FAILURE, TIMEOUT
   * Duplicate Prevention: Idempotency Key or Duplicate submission detection
   */
  async processPayment({ orderId, outcome, idempotencyKey }) {
    if (!orderId || !outcome) {
      throw { status: 400, message: 'orderId and outcome (SUCCESS, FAILURE, TIMEOUT) are required.' };
    }

    const validOutcomes = ['SUCCESS', 'FAILURE', 'TIMEOUT'];
    if (!validOutcomes.includes(outcome.toUpperCase())) {
      throw { status: 400, message: `Invalid outcome. Must be one of: ${validOutcomes.join(', ')}` };
    }

    const upperOutcome = outcome.toUpperCase();
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Check if payment with idempotency key already processed
      if (idempotencyKey) {
        const existingTx = await client.query(
          `SELECT id, order_id, idempotency_key, status, amount, created_at 
           FROM payment_transactions WHERE idempotency_key = $1`,
          [idempotencyKey]
        );

        if (existingTx.rows.length > 0) {
          await client.query('COMMIT');
          return {
            transaction: existingTx.rows[0],
            isDuplicate: true,
            message: 'Duplicate payment submission detected. Transaction previously processed.'
          };
        }
      }

      // 2. Lock Order row for update
      const orderRes = await client.query(
        `SELECT id, order_number, status, total_amount, reservation_expires_at 
         FROM orders WHERE id = $1 FOR UPDATE`,
        [orderId]
      );

      if (orderRes.rows.length === 0) {
        throw { status: 404, message: `Order with ID ${orderId} not found.` };
      }

      const order = orderRes.rows[0];

      // Prevent payment on already finalized/cancelled/expired orders
      if (['PAID', 'CANCELLED', 'EXPIRED', 'FAILED'].includes(order.status)) {
        await client.query('COMMIT');
        return {
          order,
          isDuplicate: true,
          message: `Order #${order.order_number} is already in state '${order.status}'. Payment request rejected.`
        };
      }

      // Fetch order items to adjust inventory
      const itemsRes = await client.query(
        `SELECT product_id, quantity FROM order_items WHERE order_id = $1`,
        [orderId]
      );

      let newStatus = 'PAID';

      if (upperOutcome === 'SUCCESS') {
        newStatus = 'PAID';
        // Permanent stock deduction: decrease reserved_quantity (stock was already deducted from stock_quantity)
        for (const item of itemsRes.rows) {
          await client.query(
            `UPDATE products 
             SET reserved_quantity = GREATEST(0, reserved_quantity - $1),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [item.quantity, item.product_id]
          );
        }
      } else if (upperOutcome === 'FAILURE') {
        newStatus = 'FAILED';
        // Payment failed: restore reserved stock back to stock_quantity
        for (const item of itemsRes.rows) {
          await client.query(
            `UPDATE products 
             SET stock_quantity = stock_quantity + $1,
                 reserved_quantity = GREATEST(0, reserved_quantity - $1),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [item.quantity, item.product_id]
          );
        }
      } else if (upperOutcome === 'TIMEOUT') {
        newStatus = 'EXPIRED';
        // Payment timeout: expire reservation & restore reserved stock back to available stock
        for (const item of itemsRes.rows) {
          await client.query(
            `UPDATE products 
             SET stock_quantity = stock_quantity + $1,
                 reserved_quantity = GREATEST(0, reserved_quantity - $1),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [item.quantity, item.product_id]
          );
        }
      }

      // Update Order Status
      const updatedOrderRes = await client.query(
        `UPDATE orders 
         SET status = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING id, order_number, status, total_amount::float as total_amount, updated_at`,
        [newStatus, orderId]
      );

      // Record Payment Transaction
      const key = idempotencyKey || `TX-${orderId}-${Date.now()}`;
      const txRes = await client.query(
        `INSERT INTO payment_transactions (order_id, idempotency_key, status, amount)
         VALUES ($1, $2, $3, $4)
         RETURNING id, order_id, idempotency_key, status, amount::float as amount, created_at`,
        [orderId, key, upperOutcome, order.total_amount]
      );

      await client.query('COMMIT');

      return {
        order: updatedOrderRes.rows[0],
        transaction: txRes.rows[0],
        isDuplicate: false,
        message: `Payment processed with outcome '${upperOutcome}'. Order status set to '${newStatus}'.`
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = new PaymentService();
