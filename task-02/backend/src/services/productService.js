const db = require('../config/db');

class ProductService {
  async getProducts({ search, category, minPrice, maxPrice, inStockOnly, sortBy }) {
    let query = `
      SELECT 
        id, 
        name, 
        description, 
        category, 
        price::float as price, 
        stock_quantity as available_stock, 
        reserved_quantity,
        rating::float as rating, 
        image_url, 
        created_at
      FROM products
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR description ILIKE $${params.length})`;
    }

    if (category && category !== 'All') {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    if (minPrice) {
      params.push(parseFloat(minPrice));
      query += ` AND price >= $${params.length}`;
    }

    if (maxPrice) {
      params.push(parseFloat(maxPrice));
      query += ` AND price <= $${params.length}`;
    }

    if (inStockOnly === 'true' || inStockOnly === true) {
      query += ` AND stock_quantity > 0`;
    }

    if (sortBy === 'price_asc') {
      query += ` ORDER BY price ASC`;
    } else if (sortBy === 'price_desc') {
      query += ` ORDER BY price DESC`;
    } else if (sortBy === 'rating') {
      query += ` ORDER BY rating DESC`;
    } else {
      query += ` ORDER BY id ASC`;
    }

    const res = await db.query(query, params);
    return res.rows;
  }

  async getProductById(id) {
    const query = `
      SELECT 
        id, 
        name, 
        description, 
        category, 
        price::float as price, 
        stock_quantity as available_stock, 
        reserved_quantity,
        rating::float as rating, 
        image_url, 
        created_at
      FROM products
      WHERE id = $1
    `;
    const res = await db.query(query, [id]);
    return res.rows[0] || null;
  }

  async getCategories() {
    const res = await db.query(`SELECT DISTINCT category FROM products ORDER BY category ASC`);
    return res.rows.map(r => r.category);
  }
}

module.exports = new ProductService();
