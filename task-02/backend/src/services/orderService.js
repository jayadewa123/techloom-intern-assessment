const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class OrderService {
  /**
   * Reserve Stock and Create Order for Storefront Checkout
   */
  async createReservationAndOrder({ items, idempotencyKey }) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw { status: 400, message: 'Cart cannot be empty.' };
    }

    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      if (idempotencyKey) {
        const existingRes = await client.query(
          `SELECT id, order_number, status, total_amount, reservation_expires_at, created_at 
           FROM orders WHERE idempotency_key = $1`,
          [idempotencyKey]
        );
        if (existingRes.rows.length > 0) {
          await client.query('COMMIT');
          return {
            order: existingRes.rows[0],
            isDuplicateSubmission: true,
            message: 'Duplicate checkout session submission.'
          };
        }
      }

      let totalAmount = 0;
      const verifiedItems = [];

      const sortedItems = [...items].sort((a, b) => a.productId - b.productId);

      for (const item of sortedItems) {
        const { productId, quantity } = item;
        const productRes = await client.query(
          `SELECT id, name, price, stock_quantity FROM products WHERE id = $1 FOR UPDATE`,
          [productId]
        );

        if (productRes.rows.length === 0) {
          throw { status: 404, message: `Product ID ${productId} not found.` };
        }

        const product = productRes.rows[0];

        if (product.stock_quantity < quantity) {
          throw {
            status: 409,
            message: `Out of stock! Only ${product.stock_quantity} available for '${product.name}'.`
          };
        }

        const itemTotal = parseFloat(product.price) * quantity;
        totalAmount += itemTotal;

        verifiedItems.push({
          productId: product.id,
          name: product.name,
          quantity,
          unitPrice: parseFloat(product.price),
        });
      }

      // Reserve stock atomically
      for (const item of verifiedItems) {
        await client.query(
          `UPDATE products 
           SET stock_quantity = stock_quantity - $1, 
               reserved_quantity = reserved_quantity + $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [item.quantity, item.productId]
        );
      }

      const ttlMinutes = parseInt(process.env.RESERVATION_TTL_MINUTES || '5');
      const orderNumber = `STORE-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const key = idempotencyKey || uuidv4();

      const orderRes = await client.query(
        `INSERT INTO orders (order_number, status, total_amount, idempotency_key, reservation_expires_at)
         VALUES ($1, 'RESERVED', $2, $3, NOW() + INTERVAL '${ttlMinutes} minutes')
         RETURNING id, order_number, status, total_amount::float as total_amount, idempotency_key, reservation_expires_at, created_at`,
        [orderNumber, totalAmount, key]
      );

      const order = orderRes.rows[0];

      for (const item of verifiedItems) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
           VALUES ($1, $2, $3, $4)`,
          [order.id, item.productId, item.quantity, item.unitPrice]
        );
      }

      await client.query('COMMIT');

      return {
        order: { ...order, items: verifiedItems },
        isDuplicateSubmission: false,
        message: 'Stock reserved. Please complete payment within 5 minutes.'
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Cancel Order and Refund if Paid
   */
  async cancelAndRefundOrder(orderId, reason = 'Customer requested cancellation') {
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      const orderRes = await client.query(
        `SELECT id, order_number, status, total_amount FROM orders WHERE id = $1 FOR UPDATE`,
        [orderId]
      );

      if (orderRes.rows.length === 0) {
        throw { status: 404, message: `Order ID ${orderId} not found.` };
      }

      const order = orderRes.rows[0];

      if (['CANCELLED', 'REFUNDED', 'EXPIRED'].includes(order.status)) {
        await client.query('COMMIT');
        return { order, message: `Order is already ${order.status}.` };
      }

      const itemsRes = await client.query(
        `SELECT product_id, quantity FROM order_items WHERE order_id = $1`,
        [orderId]
      );

      let newStatus = 'CANCELLED';

      if (order.status === 'PAID') {
        newStatus = 'REFUNDED';
        // Restore stock to stock_quantity
        for (const item of itemsRes.rows) {
          await client.query(
            `UPDATE products 
             SET stock_quantity = stock_quantity + $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [item.quantity, item.product_id]
          );
        }

        // Insert refund audit record
        await client.query(
          `INSERT INTO refunds (order_id, amount, reason, refund_status)
           VALUES ($1, $2, $3, 'SUCCESS')`,
          [orderId, order.total_amount, reason]
        );
      } else if (order.status === 'RESERVED' || order.status === 'PENDING') {
        newStatus = 'CANCELLED';
        // Release reserved stock back to stock_quantity
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

      const updatedRes = await client.query(
        `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 
         RETURNING id, order_number, status, total_amount::float as total_amount, updated_at`,
        [newStatus, orderId]
      );

      await client.query('COMMIT');

      return {
        order: updatedRes.rows[0],
        message: newStatus === 'REFUNDED' 
          ? `Order #${order.order_number} refunded ($${parseFloat(order.total_amount).toFixed(2)}) and stock restored!`
          : `Order #${order.order_number} cancelled and reserved stock released.`
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getAllOrders() {
    const query = `
      SELECT 
        o.id, 
        o.order_number, 
        o.status, 
        o.total_amount::float as total_amount, 
        o.idempotency_key, 
        o.reservation_expires_at, 
        o.created_at,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', oi.id,
            'productId', oi.product_id,
            'productName', p.name,
            'imageUrl', p.image_url,
            'quantity', oi.quantity,
            'unitPrice', oi.unit_price::float
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;
    const res = await db.query(query);
    return res.rows;
  }
}

module.exports = new OrderService();
