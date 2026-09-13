const express = require('express');
const cors = require('cors');
require('dotenv').config();

const productRoutes = require('./src/routes/productRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const expirationWorker = require('./src/services/expirationWorker');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Techloom POS Order & Inventory Backend API is active.',
    timestamp: new Date(),
  });
});

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Techloom POS System API',
    endpoints: {
      products: '/api/products',
      orders: '/api/orders',
      payments: '/api/payments/process',
      health: '/api/health'
    }
  });
});

// Start server and background expiry worker
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` Techloom POS Backend Server running on port ${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);

  // Start 5-minute stock reservation timeout worker (polling every 10s)
  expirationWorker.start(10000);
});