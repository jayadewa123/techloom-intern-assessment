import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ProductCatalog from './components/ProductCatalog';
import CartView from './components/CartView';
import PaymentModal from './components/PaymentModal';
import OrderHistory from './components/OrderHistory';
import ProductModal from './components/ProductModal';

import { 
  getProducts, 
  getOrders, 
  createProduct, 
  deleteProduct, 
  createOrderCheckout, 
  processPayment, 
  cancelOrder 
} from './api';

export default function App() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [activePaymentOrder, setActivePaymentOrder] = useState(null);
  const [notification, setNotification] = useState(null);

  const showToast = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };

  const fetchInitialData = async () => {
    setIsRefreshing(true);
    try {
      const [prodRes, ordRes] = await Promise.all([getProducts(), getOrders()]);
      if (prodRes.data.success) setProducts(prodRes.data.data);
      if (ordRes.data.success) setOrders(ordRes.data.data);
    } catch (err) {
      console.error('Data fetch error:', err);
      showToast(err.response?.data?.error || 'Failed to connect to backend server.', 'danger');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
    // Poll data every 10 seconds to reflect real-time background reservation expirations
    const interval = setInterval(fetchInitialData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Cart operations
  const handleAddToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.available_stock) {
          showToast(`Cannot add more '${product.name}'. Max available stock reached.`, 'warning');
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      } else {
        return [...prev, { ...product, quantity: 1 }];
      }
    });
  };

  const handleUpdateQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity: newQty } : item));
  };

  const handleRemoveFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const handleClearCart = () => setCart([]);

  // Create Checkout Order & Reserve Stock
  const handleEnterCheckout = async () => {
    if (cart.length === 0) return;
    setIsLoading(true);
    try {
      const items = cart.map(item => ({ productId: item.id, quantity: item.quantity }));
      const res = await createOrderCheckout(items);

      if (res.data.success) {
        showToast(res.data.message || 'Stock reserved successfully for 5 minutes!', 'success');
        setCart([]);
        fetchInitialData();
        setActivePaymentOrder(res.data.order);
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Checkout failed.', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  // Process Mock Payment
  const handleProcessPayment = async (orderId, outcome, idempotencyKey) => {
    setIsLoading(true);
    try {
      const res = await processPayment(orderId, outcome, idempotencyKey);
      if (res.data.success) {
        const type = outcome === 'SUCCESS' ? 'success' : 'warning';
        showToast(res.data.message, type);
        setActivePaymentOrder(null);
        fetchInitialData();
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Payment failed.', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel Order
  const handleCancelOrder = async (orderId) => {
    try {
      const res = await cancelOrder(orderId);
      if (res.data.success) {
        showToast('Order cancelled and stock restored to inventory.', 'info');
        fetchInitialData();
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Order cancellation failed.', 'danger');
    }
  };

  // Add Product
  const handleCreateProduct = async (productData) => {
    setIsLoading(true);
    try {
      const res = await createProduct(productData);
      if (res.data.success) {
        showToast(`Product '${res.data.data.name}' created successfully!`, 'success');
        setShowAddProductModal(false);
        fetchInitialData();
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create product.', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await deleteProduct(productId);
      if (res.data.success) {
        showToast('Product deleted.', 'info');
        fetchInitialData();
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete product.', 'danger');
    }
  };

  const activeReservationsCount = orders.filter(o => o.status === 'RESERVED').length;
  const paidOrdersCount = orders.filter(o => o.status === 'PAID').length;

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 2000,
          padding: '12px 20px',
          borderRadius: '8px',
          background: notification.type === 'danger' ? '#ef4444' : notification.type === 'success' ? '#10b981' : '#f59e0b',
          color: '#ffffff',
          fontWeight: 600,
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          fontSize: '0.875rem',
          maxWidth: '400px'
        }}>
          {notification.message}
        </div>
      )}

      <Header 
        onRefresh={fetchInitialData} 
        isRefreshing={isRefreshing}
        stats={{
          totalProducts: products.length,
          activeReservations: activeReservationsCount,
          paidOrders: paidOrdersCount
        }} 
      />

      <div className="grid-main">
        {/* Left Column: Product Catalog */}
        <ProductCatalog 
          products={products}
          onAddToCart={handleAddToCart}
          onOpenAddProduct={() => setShowAddProductModal(true)}
          onDeleteProduct={handleDeleteProduct}
        />

        {/* Right Column: POS Cart */}
        <CartView 
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveFromCart}
          onClearCart={handleClearCart}
          onEnterCheckout={handleEnterCheckout}
          isLoading={isLoading}
        />
      </div>

      {/* Order Lifecycle Table */}
      <OrderHistory 
        orders={orders}
        onOpenPayment={(order) => setActivePaymentOrder(order)}
        onCancelOrder={handleCancelOrder}
      />

      {/* Payment Gateway Modal */}
      {activePaymentOrder && (
        <PaymentModal 
          order={activePaymentOrder}
          onClose={() => setActivePaymentOrder(null)}
          onProcessPayment={handleProcessPayment}
          isProcessing={isLoading}
        />
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <ProductModal 
          onClose={() => setShowAddProductModal(false)}
          onSubmitProduct={handleCreateProduct}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
