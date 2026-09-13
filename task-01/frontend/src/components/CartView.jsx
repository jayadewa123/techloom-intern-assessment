import React from 'react';
import { ShoppingCart, Trash2, ShieldAlert, ArrowRight, Lock } from 'lucide-react';

export default function CartView({ cart, onUpdateQuantity, onRemoveItem, onClearCart, onEnterCheckout, isLoading }) {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShoppingCart size={20} color="#06b6d4" /> Current Cart
        </h2>
        {cart.length > 0 && (
          <button className="btn btn-outline" onClick={onClearCart} style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
            Clear
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justify: 'center',
          color: '#64748b',
          padding: '40px 0'
        }}>
          <ShoppingCart size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p style={{ fontSize: '0.9rem' }}>Cart is empty</p>
          <p style={{ fontSize: '0.75rem', color: '#475569' }}>Select items from inventory to begin order</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
          <div style={{ maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
            {cart.map((item) => (
              <div 
                key={item.id}
                style={{
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  padding: '10px',
                  background: 'rgba(15, 23, 42, 0.4)',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>{item.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    ${parseFloat(item.price).toFixed(2)} x {item.quantity} = <strong>${(item.price * item.quantity).toFixed(2)}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button 
                    className="btn btn-outline" 
                    style={{ padding: '2px 8px', fontSize: '0.9rem' }}
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  >
                    -
                  </button>
                  <span className="mono" style={{ fontSize: '0.85rem', minWidth: '20px', textAlign: 'center' }}>
                    {item.quantity}
                  </span>
                  <button 
                    className="btn btn-outline" 
                    style={{ padding: '2px 8px', fontSize: '0.9rem' }}
                    disabled={item.quantity >= item.available_stock}
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                  <button 
                    className="btn btn-outline" 
                    style={{ padding: '4px', marginLeft: '4px' }}
                    onClick={() => onRemoveItem(item.id)}
                  >
                    <Trash2 size={14} color="#ef4444" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: '#94a3b8' }}>Subtotal:</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981' }}>
                ${subtotal.toFixed(2)}
              </span>
            </div>

            <div style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '0.75rem',
              color: '#94a3b8',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Lock size={16} color="#6366f1" />
              <span>Entering checkout will reserve stock for <strong>5 minutes</strong>.</span>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '12px' }}
              onClick={onEnterCheckout}
              disabled={isLoading || cart.length === 0}
            >
              {isLoading ? 'Reserving Stock...' : 'Proceed to Checkout & Reserve Stock'}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
