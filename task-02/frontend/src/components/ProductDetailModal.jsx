import React from 'react';
import { Star, ShoppingCart, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

export default function ProductDetailModal({ product, onClose, onAddToCart }) {
  if (!product) return null;
  const isOutOfStock = product.available_stock <= 0;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(11, 15, 23, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '16px'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '640px', padding: '0', overflow: 'hidden' }}>
        <div style={{ position: 'relative', height: '240px', background: '#0f172a' }}>
          <img 
            src={product.image_url} 
            alt={product.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <button 
            className="btn btn-outline" 
            onClick={onClose}
            style={{ position: 'absolute', top: '16px', right: '16px', padding: '6px 10px', background: 'rgba(15, 23, 42, 0.8)' }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600, textTransform: 'uppercase' }}>
              {product.category}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Star size={16} color="#f59e0b" fill="#f59e0b" />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f59e0b' }}>{product.rating}</span>
            </div>
          </div>

          <h2 style={{ fontSize: '1.4rem', color: '#f1f5f9', marginBottom: '12px' }}>{product.name}</h2>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '20px' }}>
            {product.description}
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            background: 'var(--bg-surface)',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '24px',
            fontSize: '0.85rem'
          }}>
            <div>
              <span style={{ color: '#94a3b8' }}>Live Available Stock: </span>
              <strong style={{ color: isOutOfStock ? '#ef4444' : '#10b981' }}>{product.available_stock} units</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Reserved Stock: </span>
              <strong style={{ color: '#f59e0b' }}>{product.reserved_quantity || 0} units</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Price</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>
                ${parseFloat(product.price).toFixed(2)}
              </div>
            </div>

            <button 
              className="btn btn-primary"
              style={{ padding: '12px 24px', fontSize: '1rem' }}
              disabled={isOutOfStock}
              onClick={() => {
                onAddToCart(product);
                onClose();
              }}
            >
              <ShoppingCart size={18} /> Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
