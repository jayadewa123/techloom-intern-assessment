import React from 'react';
import { Star, ShoppingCart, Eye, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ProductGrid({ 
  products, 
  categories, 
  selectedCategory, 
  onSelectCategory,
  sortBy,
  onSortChange,
  inStockOnly,
  onToggleInStock,
  onAddToCart,
  onViewProductDetails 
}) {
  return (
    <div>
      {/* Category Pills & Filters Bar */}
      <div style={{
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '24px'
      }}>
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            className={`category-pill ${selectedCategory === 'All' ? 'active' : ''}`}
            onClick={() => onSelectCategory('All')}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button 
              key={cat}
              className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort & In-Stock Only Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#94a3b8', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={inStockOnly} 
              onChange={(e) => onToggleInStock(e.target.checked)} 
            />
            In Stock Only
          </label>

          <select 
            className="input-field" 
            style={{ width: '160px', padding: '6px 10px' }}
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
          >
            <option value="default">Sort by: Default</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Product Cards Grid */}
      {products.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          No products match your search or filter criteria.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: '24px'
        }}>
          {products.map((product) => {
            const available = product.available_stock;
            const isOutOfStock = available <= 0;

            return (
              <div key={product.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Image Banner */}
                <div style={{ position: 'relative', height: '180px', overflow: 'hidden', background: '#0f172a' }}>
                  <img 
                    src={product.image_url} 
                    alt={product.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isOutOfStock ? 0.4 : 0.95 }}
                  />
                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    backdropFilter: 'blur(4px)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    color: '#3b82f6',
                    fontWeight: 600
                  }}>
                    {product.category}
                  </span>

                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: isOutOfStock ? 'rgba(239, 68, 68, 0.85)' : 'rgba(16, 185, 129, 0.85)',
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    color: 'white',
                    fontWeight: 700
                  }}>
                    {isOutOfStock ? 'Out of Stock' : `${available} in stock`}
                  </span>
                </div>

                {/* Info */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                      <Star size={14} color="#f59e0b" fill="#f59e0b" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f59e0b' }}>{product.rating}</span>
                    </div>

                    <h3 style={{ fontSize: '1rem', color: '#f1f5f9', marginBottom: '6px', lineHeight: 1.3 }}>
                      {product.name}
                    </h3>

                    <p style={{
                      fontSize: '0.8rem',
                      color: '#94a3b8',
                      marginBottom: '14px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {product.description}
                    </p>
                  </div>

                  <div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981', marginBottom: '12px' }}>
                      ${parseFloat(product.price).toFixed(2)}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '8px' }}
                        title="View Details"
                        onClick={() => onViewProductDetails(product)}
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="btn btn-primary" 
                        style={{ flex: 1 }}
                        disabled={isOutOfStock}
                        onClick={() => onAddToCart(product)}
                      >
                        <ShoppingCart size={16} /> Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
