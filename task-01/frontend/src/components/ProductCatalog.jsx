import React, { useState } from 'react';
import { Plus, Package, Edit2, Trash2, ShoppingCart, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ProductCatalog({ products, onAddToCart, onOpenAddProduct, onDeleteProduct }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={20} color="#6366f1" /> Product Inventory Catalog
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Live available stock levels with concurrency protection
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            placeholder="Search product or SKU..."
            className="input-field"
            style={{ width: '220px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn btn-primary" onClick={onOpenAddProduct}>
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        {filteredProducts.map((product) => {
          const available = product.available_stock;
          const reserved = product.reserved_quantity || 0;
          const isOutOfStock = available <= 0;

          return (
            <div 
              key={product.id}
              className="glass-panel glow-hover"
              style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                borderColor: isOutOfStock ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-color)',
                background: isOutOfStock ? 'rgba(239, 68, 68, 0.05)' : 'rgba(30, 41, 59, 0.6)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '0.95rem', color: '#f8fafc' }}>{product.name}</h3>
                  <span className="mono" style={{ fontSize: '0.75rem', color: '#06b6d4', background: 'rgba(6, 182, 212, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                    {product.sku}
                  </span>
                </div>

                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981', marginBottom: '12px' }}>
                  ${parseFloat(product.price).toFixed(2)}
                </div>

                {/* Stock Stats */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.5)',
                  padding: '10px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  justify: 'space-between',
                  marginBottom: '14px'
                }}>
                  <div>
                    <div style={{ color: '#94a3b8' }}>Available Stock</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: isOutOfStock ? '#ef4444' : '#f8fafc' }}>
                      {available} units
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8' }}>Reserved</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b', textAlign: 'right' }}>
                      {reserved} units
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={isOutOfStock}
                  onClick={() => onAddToCart(product)}
                >
                  <ShoppingCart size={16} /> Add to Cart
                </button>
                <button
                  className="btn btn-outline"
                  title="Delete Product"
                  onClick={() => onDeleteProduct(product.id)}
                  style={{ padding: '8px' }}
                >
                  <Trash2 size={16} color="#ef4444" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
