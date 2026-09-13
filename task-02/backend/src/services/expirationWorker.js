const db = require('../config/db');

class ExpirationWorker {
  constructor() {
    this.intervalId = null;
  }

  start(intervalMs = 10000) {
    console.log(`[Task-02 Worker] Monitoring checkout stock reservations (every ${intervalMs / 1000}s)...`);
    this.intervalId = setInterval(async () => {
      await this.checkAndReleaseExpiredReservations();
    }, intervalMs);
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  async checkAndReleaseExpiredReservations() {
    let client;
    try {
      client = await db.pool.connect();
      await client.query('BEGIN');

      const expiredOrdersRes = await client.query(
        `SELECT id, order_number FROM orders 
         WHERE status = 'RESERVED' AND reservation_expires_at < NOW() 
         FOR UPDATE`
      );

      if (expiredOrdersRes.rows.length === 0) {
        await client.query('COMMIT');
        return;
      }

      for (const order of expiredOrdersRes.rows) {
        const itemsRes = await client.query(
          `SELECT product_id, quantity FROM order_items WHERE order_id = $1`,
          [order.id]
        );

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

        await client.query(
          `UPDATE orders SET status = 'EXPIRED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [order.id]
        );

        console.log(`[Task-02 Worker] Auto-released stock for Expired Checkout Session #${order.order_number}`);
      }

      await client.query('COMMIT');
    } catch (err) {
      if (client) {
        try { await client.query('ROLLBACK'); } catch (_) {}
      }
      console.error('[Task-02 Worker] Warning:', err.message);
    } finally {
      if (client) client.release();
    }
  }
}

module.exports = new ExpirationWorker();
