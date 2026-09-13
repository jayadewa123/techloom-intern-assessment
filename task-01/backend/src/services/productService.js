const db = require('../config/db');

class ProductService {
  async getAllProducts() {
    const query = `
      SELECT 
        id, 
        name, 
        sku, 
        price::float as price, 
        stock_quantity as available_stock, 
        reserved_quantity,
        (stock_quantity + reserved_quantity) as total_stock,
        created_at, 
        updated_at
      FROM products
      ORDER BY id ASC
    `;
    const res = await db.query(query);
    return res.rows;
  }

  async getProductById(id) {
    const query = `
      SELECT 
        id, 
        name, 
        sku, 
        price::float as price, 
        stock_quantity as available_stock, 
        reserved_quantity,
        (stock_quantity + reserved_quantity) as total_stock,
        created_at, 
        updated_at
      FROM products
      WHERE id = $1
    `;
    const res = await db.query(query, [id]);
    return res.rows[0] || null;
  }

  async createProduct({ name, sku, price, stock_quantity }) {
    const query = `
      INSERT INTO products (name, sku, price, stock_quantity, reserved_quantity)
      VALUES ($1, $2, $3, $4, 0)
      RETURNING id, name, sku, price::float as price, stock_quantity as available_stock, reserved_quantity, created_at
    `;
    const res = await db.query(query, [name, sku, price, stock_quantity || 0]);
    return res.rows[0];
  }

  async updateProduct(id, { name, price, stock_quantity }) {
    const query = `
      UPDATE products
      SET 
        name = COALESCE($1, name),
        price = COALESCE($2, price),
        stock_quantity = COALESCE($3, stock_quantity),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, name, sku, price::float as price, stock_quantity as available_stock, reserved_quantity, updated_at
    `;
    const res = await db.query(query, [name, price, stock_quantity, id]);
    return res.rows[0];
  }

  async deleteProduct(id) {
    const query = `DELETE FROM products WHERE id = $1 RETURNING id`;
    const res = await db.query(query, [id]);
    return res.rows.length > 0;
  }
}

module.exports = new ProductService();
