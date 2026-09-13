import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getProducts = () => api.get('/products');
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

export const createOrderCheckout = (items, idempotencyKey) => 
  api.post('/orders/checkout', { items, idempotencyKey });

export const cancelOrder = (orderId) => api.post(`/orders/${orderId}/cancel`);
export const getOrders = () => api.get('/orders');
export const getOrderById = (id) => api.get(`/orders/${id}`);

export const processPayment = (orderId, outcome, idempotencyKey) => 
  api.post('/payments/process', { orderId, outcome, idempotencyKey });

export default api;
