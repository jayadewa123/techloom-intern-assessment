import React from 'react';
import { History, CreditCard, Ban, RefreshCw, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function OrderHistory({ orders, onOpenPayment, onCancelOrder }) {
  const getBadgeClass = (status) => {
    switch (status) {
      case 'RESERVED': return 'badge-reserved';
      case 'PAID': return 'badge-paid';
      case 'CANCELLED': return 'badge-cancelled';
      case 'FAILED': return 'badge-failed';
      case 'EXPIRED': return 'badge-expired';
      default: return 'badge-reserved';
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', marginTop: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={20} color="#10b981" /> Order Lifecycle & History
        </h2>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          Total Orders: <strong>{orders.length}</strong>
        </span>
      </div>

      {orders.length === 0 ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
          No orders submitted yet.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Order #</th>
                <th style={{ padding: '10px' }}>Items</th>
                <th style={{ padding: '10px' }}>Total</th>
                <th style={{ padding: '10px' }}>Status</th>
                <th style={{ padding: '10px' }}>Date</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const itemsStr = order.items && Array.isArray(order.items) 
                  ? order.items.map(i => `${i.productName || 'Item'} (x${i.quantity})`).join(', ') 
                  : 'N/A';

                const canPay = order.status === 'RESERVED' || order.status === 'PENDING';
                const canCancel = ['RESERVED', 'PENDING', 'PAID'].includes(order.status);

                return (
                  <tr 
                    key={order.id}
                    style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.5)', transition: 'background 0.2s' }}
                  >
                    <td className="mono" style={{ padding: '12px 10px', fontWeight: 600, color: '#06b6d4' }}>
                      {order.order_number}
                    </td>
                    <td style={{ padding: '12px 10px', color: '#cbd5e1', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {itemsStr}
                    </td>
                    <td style={{ padding: '12px 10px', fontWeight: 700, color: '#10b981' }}>
                      ${parseFloat(order.total_amount).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <span className={`badge ${getBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', color: '#94a3b8', fontSize: '0.75rem' }}>
                      {new Date(order.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        {canPay && (
                          <button 
                            className="btn btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                            onClick={() => onOpenPayment(order)}
                          >
                            <CreditCard size={14} /> Pay Now
                          </button>
                        )}
                        {canCancel && (
                          <button 
                            className="btn btn-outline"
                            style={{ padding: '6px 10px', fontSize: '0.75rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                            onClick={() => onCancelOrder(order.id)}
                          >
                            <Ban size={14} /> Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
