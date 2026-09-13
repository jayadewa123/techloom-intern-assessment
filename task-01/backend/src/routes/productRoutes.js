const express = require('express');
const router = express.Router();
const productService = require('../services/productService');

// GET /api/products - Get all products with current stock levels
router.get('/', async (req, res) => {
  try {
    const products = await productService.getAllProducts();
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/products/:id - Get single product
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

// POST /api/products - Create new product
router.post('/', async (req, res) => {
  try {
    const { name, sku, price, stock_quantity } = req.body;
    if (!name || !sku || price === undefined) {
      return res.status(400).json({ success: false, error: 'Name, SKU, and price are required.' });
    }
    const product = await productService.createProduct({ name, sku, price, stock_quantity });
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message || err.error });
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', async (req, res) => {
  try {
    const updated = await productService.updateProduct(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await productService.deleteProduct(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
