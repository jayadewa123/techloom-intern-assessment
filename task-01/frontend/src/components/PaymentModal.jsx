import React, { useState, useEffect } from 'react';
import { CreditCard, Clock, CheckCircle2, XCircle, AlertTriangle, Copy, ShieldAlert } from 'lucide-react';

export default function PaymentModal({ order, onClose, onProcessPayment, isProcessing }) {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [idempotencyKey, setIdempotencyKey] = useState(`PAY-KEY-${Date.now()}`);

  useEffect(() => {
    if (!order || !order.reservation_expires_at) return;

    const calculateTimeLeft = () => {
      const expiresAt = new Date(order.reservation_expires_at).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeLeft(diff);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [order]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!order) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justify: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={22} color="#6366f1" /> Mock Payment Gateway
          </h2>
          <button className="btn btn-outline" onClick={onClose} style={{ padding: '4px 8px' }}>✕</button>
        </div>

        {/* Order Details & Timer */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Order Number:</span>
            <span className="mono" style={{ fontWeight: 600, color: '#06b6d4' }}>{order.order_number}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Total Amount:</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#10b981' }}>
              ${parseFloat(order.total_amount).toFixed(2)}
            </span>
          </div>

          {/* 5-minute Stock Reservation Timer */}
          <div style={{
            background: timeLeft < 60 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.15)',
            border: timeLeft < 60 ? '1px solid #ef4444' : '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '10px',
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#f8fafc' }}>
              <Clock size={18} color={timeLeft < 60 ? '#ef4444' : '#f59e0b'} />
              <span>Stock Locked Expiry:</span>
            </div>
            <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: timeLeft < 60 ? '#ef4444' : '#f59e0b' }}>
              {formatTimer(timeLeft)}
            </div>
          </div>
        </div>

        {/* Idempotency Key Info */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px' }}>
            Submission Idempotency Key (Prevents Duplicate Charges):
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              className="input-field mono"
              style={{ fontSize: '0.8rem' }}
              value={idempotencyKey}
              onChange={(e) => setIdempotencyKey(e.target.value)}
            />
            <button 
              className="btn btn-outline"
              title="Regenerate Key"
              onClick={() => setIdempotencyKey(`PAY-KEY-${Date.now()}`)}
            >
              New Key
            </button>
          </div>
        </div>

        {/* Mock Payment Action Buttons */}
        <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '10px', color: '#cbd5e1' }}>
          Select Gateway Response to Test:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button 
            className="btn btn-success" 
            style={{ width: '100%', padding: '12px', justifyContent: 'flex-start' }}
            disabled={isProcessing || timeLeft <= 0}
            onClick={() => onProcessPayment(order.id, 'SUCCESS', idempotencyKey)}
          >
            <CheckCircle2 size={18} /> Simulate Payment SUCCESS (Status $\rightarrow$ PAID)
          </button>

          <button 
            className="btn btn-danger" 
            style={{ width: '100%', padding: '12px', justifyContent: 'flex-start' }}
            disabled={isProcessing}
            onClick={() => onProcessPayment(order.id, 'FAILURE', idempotencyKey)}
          >
            <XCircle size={18} /> Simulate Payment FAILURE (Release Stock)
          </button>

          <button 
            className="btn btn-outline" 
            style={{ width: '100%', padding: '12px', justifyContent: 'flex-start', color: '#f59e0b', borderColor: '#f59e0b' }}
            disabled={isProcessing}
            onClick={() => onProcessPayment(order.id, 'TIMEOUT', idempotencyKey)}
          >
            <AlertTriangle size={18} /> Simulate Payment TIMEOUT (Expire & Release Stock)
          </button>

          <button 
            className="btn btn-outline" 
            style={{ width: '100%', padding: '10px', justifyContent: 'center', marginTop: '6px', fontSize: '0.8rem', color: '#06b6d4' }}
            disabled={isProcessing}
            onClick={() => {
              // Send same request twice to test duplicate prevention
              onProcessPayment(order.id, 'SUCCESS', idempotencyKey);
              setTimeout(() => {
                onProcessPayment(order.id, 'SUCCESS', idempotencyKey);
              }, 300);
            }}
          >
            <ShieldAlert size={16} /> Test Duplicate Payment Click (Idempotency Protection)
          </button>
        </div>
      </div>
    </div>
  );
}
