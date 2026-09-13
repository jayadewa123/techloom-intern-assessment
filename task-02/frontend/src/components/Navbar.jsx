import React from 'react';
import { ShoppingBag, Search, ShoppingCart, History, Filter } from 'lucide-react';

export default function Navbar({ 
  cartCount, 
  onToggleCart, 
  onToggleOrders, 
  searchTerm, 
  onSearchChange,
  showOrders 
}) {
  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justify: 'space-between',
      paddingBottom: '20px',
      marginBottom: '24px',
      borderBottom: '1px solid var(--border-color)',
      gap: '16px',
      flexWrap: 'wrap'
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          padding: '10px',
          borderRadius: '12px',
          display: 'flex'
        }}>
          <ShoppingBag size={24} color="#ffffff" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.4rem', color: '#f1f5f9' }}>Techloom Store</h1>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Next-Gen E-Commerce & Concurrency Payment Engine
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div style={{ flex: 1, maxWidth: '450px', minWidth: '260px', position: 'relative' }}>
        <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        <input 
          type="text" 
          placeholder="Search products by name or description..."
          style={{
            width: '100%',
            padding: '10px 14px 10px 42px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            color: '#f1f5f9',
            fontSize: '0.875rem',
            outline: 'none'
          }}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button 
          className={`btn ${showOrders ? 'btn-primary' : 'btn-outline'}`}
          onClick={onToggleOrders}
        >
          <History size={18} /> My Orders
        </button>

        <button 
          className="btn btn-primary"
          onClick={onToggleCart}
          style={{ position: 'relative' }}
        >
          <ShoppingCart size={18} /> Cart
          {cartCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              background: '#ef4444',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 700,
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justify: 'center'
            }}>
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
