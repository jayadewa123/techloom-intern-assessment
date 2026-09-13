const db = require('../config/db');

class PaymentService {
  async processPayment({ orderId, outcome, idempotencyKey }) {
    if (!orderId || !outcome) {
      throw { status: 400, message: 'orderId and outcome are required.' };
    }

    const validOutcomes = ['SUCCESS', 'FAILURE', 'TIMEOUT'];
    if (!validOutcomes.includes(outcome.toUpperCase())) {
      throw { status: 400, message: `Invalid outcome. Allowed: ${validOutcomes.join(', ')}` };
    }

    const upperOutcome = outcome.toUpperCase();
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

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
            message: 'Duplicate payment submission blocked by Idempotency Engine.'
          };
        }
      }

      const orderRes = await client.query(
        `SELECT id, order_number, status, total_amount FROM orders WHERE id = $1 FOR UPDATE`,
        [orderId]
      );

      if (orderRes.rows.length === 0) {
        throw { status: 404, message: `Order ID ${orderId} not found.` };
      }

      const order = orderRes.rows[0];

      if (['PAID', 'CANCELLED', 'REFUNDED', 'EXPIRED', 'FAILED'].includes(order.status)) {
        await client.query('COMMIT');
        return {
          order,
          isDuplicate: true,
          message: `Order #${order.order_number} is in state '${order.status}'. Payment attempt rejected.`
        };
      }

      const itemsRes = await client.query(
        `SELECT product_id, quantity FROM order_items WHERE order_id = $1`,
        [orderId]
      );

      let newStatus = 'PAID';

      if (upperOutcome === 'SUCCESS') {
        newStatus = 'PAID';
        for (const item of itemsRes.rows) {
          await client.query(
            `UPDATE products 
             SET reserved_quantity = GREATEST(0, reserved_quantity - $1), updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [item.quantity, item.product_id]
          );
        }
      } else if (upperOutcome === 'FAILURE') {
        newStatus = 'FAILED';
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

      const updatedOrderRes = await client.query(
        `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 
         RETURNING id, order_number, status, total_amount::float as total_amount, updated_at`,
        [newStatus, orderId]
      );

      const key = idempotencyKey || `TX-STORE-${orderId}-${Date.now()}`;
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
        message: `Payment ${upperOutcome}. Order status updated to '${newStatus}'.`
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
