import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ProductGrid from './components/ProductGrid';
import ProductDetailModal from './components/ProductDetailModal';
import CartDrawer from './components/CartDrawer';
import CheckoutPaymentModal from './components/CheckoutPaymentModal';
import OrderHistoryView from './components/OrderHistoryView';

import { 
  getProducts, 
  getCategories, 
  getOrders, 
  createCheckoutSession, 
  processPayment, 
  cancelAndRefundOrder 
} from './api';

export default function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('default');
  const [inStockOnly, setInStockOnly] = useState(false);

  // UI State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showOrdersView, setShowOrdersView] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activePaymentOrder, setActivePaymentOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [notification, setNotification] = useState(null);

  const showToast = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };

  const fetchProducts = async () => {
    try {
      const res = await getProducts({
        search: searchTerm,
        category: selectedCategory,
        sortBy,
        inStockOnly
      });
      if (res.data.success) setProducts(res.data.data);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      if (res.data.success) setCategories(res.data.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await getOrders();
      if (res.data.success) setOrders(res.data.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchOrders();
  }, []);

  useEffect(() => {
    fetchProducts();
    const interval = setInterval(() => {
      fetchProducts();
      fetchOrders();
    }, 10000);
    return () => clearInterval(interval);
  }, [searchTerm, selectedCategory, sortBy, inStockOnly]);

  // Cart Management
  const handleAddToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        if (existing.quantity >= product.available_stock) {
          showToast(`Max available stock reached for '${product.name}'.`, 'warning');
          return prev;
        }
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      } else {
        return [...prev, { ...product, quantity: 1 }];
      }
    });
    showToast(`Added '${product.name}' to cart.`, 'success');
  };

  const handleUpdateQuantity = (id, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(id);
      return;
    }
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: newQty } : i));
  };

  const handleRemoveItem = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const handleClearCart = () => setCart([]);

  // Checkout & Stock Reservation
  const handleProceedToCheckout = async () => {
    if (cart.length === 0) return;
    setIsLoading(true);
    try {
      const items = cart.map(i => ({ productId: i.id, quantity: i.quantity }));
      const res = await createCheckoutSession(items);
      if (res.data.success) {
        showToast('Stock reserved! Complete payment within 5 minutes.', 'success');
        setCart([]);
        setIsCartOpen(false);
        fetchProducts();
        fetchOrders();
        setActivePaymentOrder(res.data.order);
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Checkout failed.', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  // Mock Payment
  const handleProcessPayment = async (orderId, outcome, idempotencyKey) => {
    setIsLoading(true);
    try {
      const res = await processPayment(orderId, outcome, idempotencyKey);
      if (res.data.success) {
        showToast(res.data.message, outcome === 'SUCCESS' ? 'success' : 'warning');
        setActivePaymentOrder(null);
        fetchProducts();
        fetchOrders();
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Payment failed.', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel / Refund
  const handleCancelOrRefund = async (orderId) => {
    try {
      const res = await cancelAndRefundOrder(orderId, 'Customer requested refund via Storefront');
      if (res.data.success) {
        showToast(res.data.message, 'info');
        fetchProducts();
        fetchOrders();
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Action failed.', 'danger');
    }
  };

  return (
    <div className="store-container">
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 2000,
          padding: '12px 20px', borderRadius: '10px',
          background: notification.type === 'danger' ? '#ef4444' : notification.type === 'success' ? '#10b981' : '#3b82f6',
          color: 'white', fontWeight: 600, boxShadow: '0 10px 25px rgba(0,0,0,0.5)', fontSize: '0.875rem'
        }}>
          {notification.message}
        </div>
      )}

      <Navbar 
        cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)}
        onToggleCart={() => setIsCartOpen(true)}
        onToggleOrders={() => setShowOrdersView(!showOrdersView)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showOrders={showOrdersView}
      />

      {showOrdersView ? (
        <OrderHistoryView 
          orders={orders}
          onBackToStore={() => setShowOrdersView(false)}
          onOpenPayment={(order) => setActivePaymentOrder(order)}
          onCancelOrRefund={handleCancelOrRefund}
        />
      ) : (
        <ProductGrid 
          products={products}
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          sortBy={sortBy}
          onSortChange={setSortBy}
          inStockOnly={inStockOnly}
          onToggleInStock={setInStockOnly}
          onAddToCart={handleAddToCart}
          onViewProductDetails={(product) => setSelectedProduct(product)}
        />
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Cart Side Drawer */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onProceedToCheckout={handleProceedToCheckout}
        isLoading={isLoading}
      />

      {/* Checkout Payment Gateway Modal */}
      {activePaymentOrder && (
        <CheckoutPaymentModal 
          order={activePaymentOrder}
          onClose={() => setActivePaymentOrder(null)}
          onProcessPayment={handleProcessPayment}
          isProcessing={isLoading}
        />
      )}
    </div>
  );
}
