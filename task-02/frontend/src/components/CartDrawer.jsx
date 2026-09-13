import React from 'react';
import { ShoppingCart, Trash2, ArrowRight, Lock, X } from 'lucide-react';

export default function CartDrawer({ 
  isOpen, 
  onClose, 
  cart, 
  onUpdateQuantity, 
  onRemoveItem, 
  onClearCart, 
  onProceedToCheckout,
  isLoading 
}) {
  if (!isOpen) return null;
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(11, 15, 23, 0.75)',
      backdropFilter: 'blur(6px)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'flex-end'
    }}>
      <div className="glass-card" style={{
        width: '100%', maxWidth: '440px', height: '100%', borderRadius: 0,
        padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart size={22} color="#3b82f6" /> Shopping Cart ({cart.length})
            </h2>
            <button className="btn btn-outline" onClick={onClose} style={{ padding: '6px' }}><X size={18} /></button>
          </div>

          {cart.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
              <ShoppingCart size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p>Your shopping cart is empty.</p>
            </div>
          ) : (
            <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
              {cart.map((item) => (
                <div key={item.id} style={{
                  display: 'flex', gap: '12px', padding: '12px',
                  background: 'var(--bg-surface)', borderRadius: '10px',
                  marginBottom: '10px', border: '1px solid var(--border-color)'
                }}>
                  <img src={item.image_url} alt={item.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }} />
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f1f5f9' }}>{item.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700, margin: '2px 0' }}>
                      ${parseFloat(item.price).toFixed(2)}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <button className="btn btn-outline" style={{ padding: '2px 8px' }} onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}>-</button>
                      <span className="mono" style={{ fontSize: '0.85rem' }}>{item.quantity}</span>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '2px 8px' }} 
                        disabled={item.quantity >= item.available_stock}
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                      <button className="btn btn-outline" style={{ padding: '4px', marginLeft: 'auto' }} onClick={() => onRemoveItem(item.id)}>
                        <Trash2 size={14} color="#ef4444" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: '#94a3b8' }}>Total Amount:</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>${subtotal.toFixed(2)}</span>
            </div>

            <div style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '0.75rem',
              color: '#94a3b8',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Lock size={16} color="#3b82f6" />
              <span>Stock locked for <strong>5 minutes</strong> at checkout.</span>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
              onClick={onProceedToCheckout}
              disabled={isLoading}
            >
              {isLoading ? 'Reserving Stock...' : 'Proceed to Checkout'} <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
