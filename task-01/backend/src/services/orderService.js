const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class OrderService {
  /**
   * Concurrency-Safe Checkout & Stock Reservation
   * Atomically reserves stock and creates order under transaction isolation.
   */
  async createReservationAndOrder({ items, idempotencyKey }) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw { status: 400, message: 'Cart must contain at least one item.' };
    }

    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Check idempotency key if provided
      if (idempotencyKey) {
        const existingOrderRes = await client.query(
          `SELECT id, order_number, status, total_amount, reservation_expires_at, created_at 
           FROM orders WHERE idempotency_key = $1`,
          [idempotencyKey]
        );
        if (existingOrderRes.rows.length > 0) {
          await client.query('COMMIT');
          return {
            order: existingOrderRes.rows[0],
            isDuplicateSubmission: true,
            message: 'Order already exists for this submission key.'
          };
        }
      }

      let totalAmount = 0;
      const verifiedItems = [];

      // Sort item IDs to avoid deadlocks when locking rows under concurrent calls
      const sortedItems = [...items].sort((a, b) => a.productId - b.productId);

      // 2. Validate and Lock Product Stock (SELECT FOR UPDATE)
      for (const item of sortedItems) {
        const { productId, quantity } = item;
        if (!productId || !quantity || quantity <= 0) {
          throw { status: 400, message: `Invalid product ID or quantity.` };
        }

        // Row-level lock to prevent concurrent modifications
        const productRes = await client.query(
          `SELECT id, name, price, stock_quantity, reserved_quantity 
           FROM products WHERE id = $1 FOR UPDATE`,
          [productId]
        );

        if (productRes.rows.length === 0) {
          throw { status: 404, message: `Product with ID ${productId} not found.` };
        }

        const product = productRes.rows[0];

        if (product.stock_quantity < quantity) {
          throw {
            status: 409,
            message: `Insufficient stock for product '${product.name}'. Available: ${product.stock_quantity}, Requested: ${quantity}`
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

      // 3. Deduct available stock and add to reserved stock atomically
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

      // 4. Create Order record (5-minute TTL)
      const ttlMinutes = parseInt(process.env.RESERVATION_TTL_MINUTES || '5');
      const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const key = idempotencyKey || uuidv4();

      const orderRes = await client.query(
        `INSERT INTO orders (order_number, status, total_amount, idempotency_key, reservation_expires_at)
         VALUES ($1, 'RESERVED', $2, $3, NOW() + INTERVAL '${ttlMinutes} minutes')
         RETURNING id, order_number, status, total_amount::float as total_amount, idempotency_key, reservation_expires_at, created_at`,
        [orderNumber, totalAmount, key]
      );

      const order = orderRes.rows[0];

      // 5. Create Order Items
      for (const item of verifiedItems) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
           VALUES ($1, $2, $3, $4)`,
          [order.id, item.productId, item.quantity, item.unitPrice]
        );
      }

      await client.query('COMMIT');

      return {
        order: {
          ...order,
          items: verifiedItems,
        },
        isDuplicateSubmission: false,
        message: 'Order created and stock reserved for 5 minutes.'
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Cancel Order and Restore Stock
   */
  async cancelOrder(orderId) {
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      const orderRes = await client.query(
        `SELECT id, order_number, status FROM orders WHERE id = $1 FOR UPDATE`,
        [orderId]
      );

      if (orderRes.rows.length === 0) {
        throw { status: 404, message: `Order with ID ${orderId} not found.` };
      }

      const order = orderRes.rows[0];

      if (order.status === 'CANCELLED' || order.status === 'EXPIRED') {
        await client.query('COMMIT');
        return { order, message: `Order is already ${order.status}.` };
      }

      // Fetch items to restore stock
      const itemsRes = await client.query(
        `SELECT product_id, quantity FROM order_items WHERE order_id = $1`,
        [orderId]
      );

      // Restore stock based on current status
      for (const item of itemsRes.rows) {
        if (order.status === 'RESERVED' || order.status === 'PENDING') {
          // Release reserved stock back to available stock
          await client.query(
            `UPDATE products 
             SET stock_quantity = stock_quantity + $1, 
                 reserved_quantity = GREATEST(0, reserved_quantity - $1),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [item.quantity, item.product_id]
          );
        } else if (order.status === 'PAID') {
          // Paid order cancellation (Refund): return items back to available stock
          await client.query(
            `UPDATE products 
             SET stock_quantity = stock_quantity + $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [item.quantity, item.product_id]
          );
        }
      }

      // Update status to CANCELLED
      const updatedOrderRes = await client.query(
        `UPDATE orders 
         SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 
         RETURNING id, order_number, status, total_amount::float as total_amount, updated_at`,
        [orderId]
      );

      await client.query('COMMIT');

      return {
        order: updatedOrderRes.rows[0],
        message: 'Order cancelled successfully and stock restored.'
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

  async getOrderById(orderId) {
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
            'quantity', oi.quantity,
            'unitPrice', oi.unit_price::float
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = $1
      GROUP BY o.id
    `;
    const res = await db.query(query, [orderId]);
    return res.rows[0] || null;
  }
}

module.exports = new OrderService();
