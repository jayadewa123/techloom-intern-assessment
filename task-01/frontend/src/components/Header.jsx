import React from 'react';
import { ShoppingBag, RefreshCw, ShieldCheck, Clock } from 'lucide-react';

export default function Header({ onRefresh, isRefreshing, stats }) {
  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
          padding: '10px',
          borderRadius: '10px',
          display: 'flex'
        }}>
          <ShoppingBag size={24} color="#ffffff" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.4rem', color: '#f8fafc' }}>Techloom POS System</h1>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Concurrency-Safe POS & Stock Lock Engine (5-min TTL)
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '8px 16px', display: 'flex', gap: '16px', fontSize: '0.85rem' }}>
          <div>
            <span style={{ color: '#94a3b8' }}>Products: </span>
            <strong style={{ color: '#06b6d4' }}>{stats.totalProducts || 0}</strong>
          </div>
          <div>
            <span style={{ color: '#94a3b8' }}>Reserved: </span>
            <strong style={{ color: '#f59e0b' }}>{stats.activeReservations || 0}</strong>
          </div>
          <div>
            <span style={{ color: '#94a3b8' }}>Paid Orders: </span>
            <strong style={{ color: '#10b981' }}>{stats.paidOrders || 0}</strong>
          </div>
        </div>

        <button 
          className="btn btn-outline" 
          onClick={onRefresh}
          disabled={isRefreshing}
          style={{ gap: '6px' }}
        >
          <RefreshCw size={16} className={isRefreshing ? 'spin' : ''} />
          Refresh
        </button>
      </div>
    </header>
  );
}
