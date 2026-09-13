const express = require('express');
const cors = require('cors');
require('dotenv').config();

const productRoutes = require('./src/routes/productRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const expirationWorker = require('./src/services/expirationWorker');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// API Endpoints
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Techloom E-Commerce Storefront Backend API is active.',
    timestamp: new Date(),
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Techloom E-Commerce Storefront API',
    endpoints: {
      products: '/api/products',
      orders: '/api/orders',
      payments: '/api/payments/process',
      health: '/api/health'
    }
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` Techloom Storefront Backend running on port ${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);

  // Start 5-minute checkout stock reservation worker
  expirationWorker.start(10000);
});
