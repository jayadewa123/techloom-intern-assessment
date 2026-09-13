import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getProducts = (params) => api.get('/products', { params });
export const getCategories = () => api.get('/products/categories');
export const getProductById = (id) => api.get(`/products/${id}`);

export const createCheckoutSession = (items, idempotencyKey) => 
  api.post('/orders/checkout', { items, idempotencyKey });

export const processPayment = (orderId, outcome, idempotencyKey) => 
  api.post('/payments/process', { orderId, outcome, idempotencyKey });

export const cancelAndRefundOrder = (orderId, reason) => 
  api.post(`/orders/${orderId}/cancel-refund`, { reason });

export const getOrders = () => api.get('/orders');

export default api;
