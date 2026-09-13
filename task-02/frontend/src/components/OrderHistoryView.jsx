import React from 'react';
import { History, CreditCard, RotateCcw, Ban, ArrowLeft } from 'lucide-react';

export default function OrderHistoryView({ orders, onBackToStore, onOpenPayment, onCancelOrRefund }) {
  const getBadgeClass = (status) => {
    switch (status) {
      case 'RESERVED': return 'badge-reserved';
      case 'PAID': return 'badge-paid';
      case 'REFUNDED': return 'badge-refunded';
      case 'CANCELLED': return 'badge-cancelled';
      case 'FAILED': return 'badge-failed';
      case 'EXPIRED': return 'badge-expired';
      default: return 'badge-reserved';
    }
  };

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-outline" onClick={onBackToStore} style={{ padding: '8px 12px' }}>
            <ArrowLeft size={16} /> Back to Store
          </button>
          <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={22} color="#3b82f6" /> Customer Order History & Refunds
          </h2>
        </div>

        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
          Total Past Orders: <strong>{orders.length}</strong>
        </span>
      </div>

      {orders.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          No orders found. Purchase items in the store to view order history.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {orders.map((order) => {
            const canPay = order.status === 'RESERVED' || order.status === 'PENDING';
            const canRefund = order.status === 'PAID';
            const canCancel = order.status === 'RESERVED' || order.status === 'PENDING';

            return (
              <div key={order.id} style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <span className="mono" style={{ fontSize: '1rem', fontWeight: 700, color: '#3b82f6' }}>
                      {order.order_number}
                    </span>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                      Placed on {new Date(order.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className={`badge ${getBadgeClass(order.status)}`}>
                      {order.status}
                    </span>

                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>
                      ${parseFloat(order.total_amount).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div style={{
                  background: 'var(--bg-card)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '14px',
                  fontSize: '0.85rem'
                }}>
                  {order.items && Array.isArray(order.items) && order.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span style={{ color: '#cbd5e1' }}>{item.productName || 'Item'} (x{item.quantity})</span>
                      <span style={{ color: '#94a3b8' }}>${(item.unitPrice * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  {canPay && (
                    <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '8px 14px' }} onClick={() => onOpenPayment(order)}>
                      <CreditCard size={14} /> Pay Now
                    </button>
                  )}

                  {canRefund && (
                    <button 
                      className="btn btn-outline" 
                      style={{ fontSize: '0.8rem', padding: '8px 14px', color: '#8b5cf6', borderColor: '#8b5cf6' }}
                      onClick={() => onCancelOrRefund(order.id)}
                    >
                      <RotateCcw size={14} /> Request Refund & Restore Stock
                    </button>
                  )}

                  {canCancel && (
                    <button 
                      className="btn btn-outline" 
                      style={{ fontSize: '0.8rem', padding: '8px 14px', color: '#ef4444', borderColor: '#ef4444' }}
                      onClick={() => onCancelOrRefund(order.id)}
                    >
                      <Ban size={14} /> Cancel Reservation
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
