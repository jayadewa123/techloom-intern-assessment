import React, { useState } from 'react';
import { PackagePlus } from 'lucide-react';

export default function ProductModal({ onClose, onSubmitProduct, isLoading }) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState(`POS-SKU-${Math.floor(100 + Math.random() * 900)}`);
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('10');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !sku || !price) return;
    onSubmitProduct({
      name,
      sku,
      price: parseFloat(price),
      stock_quantity: parseInt(stock, 10)
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '16px'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PackagePlus size={20} color="#6366f1" /> Create Product Inventory
          </h2>
          <button className="btn btn-outline" onClick={onClose} style={{ padding: '4px 8px' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Product Name</label>
            <input 
              type="text" 
              className="input-field"
              placeholder="e.g. Wireless Barcode Scanner"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>SKU Code</label>
            <input 
              type="text" 
              className="input-field mono"
              required
              value={sku}
              onChange={(e) => setSku(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Price ($)</label>
              <input 
                type="number" 
                step="0.01" 
                className="input-field"
                placeholder="49.99"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Initial Stock</label>
              <input 
                type="number" 
                className="input-field"
                placeholder="10"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
