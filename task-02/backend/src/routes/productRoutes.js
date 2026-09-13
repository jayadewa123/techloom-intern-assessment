const express = require('express');
const router = express.Router();
const productService = require('../services/productService');

// GET /api/products - Search, Filter, Sort Products
router.get('/', async (req, res) => {
  try {
    const products = await productService.getProducts(req.query);
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/products/categories - List available product categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await productService.getCategories();
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/products/:id - Get product details
router.get('/:id', async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
