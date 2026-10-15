import React from 'react';
import { X, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export const AnomalyExplainModal = ({ alert, onClose, onDispatchWorkOrder }) => {
  if (!alert) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} style={{ color: 'var(--color-danger)' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Anomaly Explainability & Root Cause Analysis</h3>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="mono" style={{ fontSize: '0.78rem', fontWeight: 700 }}>{alert.alertId}</span>
              <StatusBadge status={alert.severity} />
            </div>
            <h4 style={{ fontSize: '0.96rem', fontWeight: 700 }}>{alert.machineName}</h4>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Location: {alert.line}</div>
          </div>

          <div style={{ background: '#f8fafc', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Identified Failure Mode</span>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-primary)', marginTop: 2 }}>
              {alert.failureMode}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Combined Anomaly Confidence Score: <strong className="mono">{(alert.anomalyScore * 100).toFixed(0)}%</strong>
            </div>
          </div>

          {/* Explainability Breakdown */}
          <div>
            <h5 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>
              Sensor Feature Attribution & Contribution
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alert.explainability?.map((item, idx) => (
                <div key={idx} style={{ background: '#ffffff', border: '1px solid var(--border-color)', padding: 10, borderRadius: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                    <span>{item.feature}</span>
                    <span className="mono" style={{ color: 'var(--color-primary)' }}>{item.contributionPercent}%</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: '#f1f5f9', borderRadius: 9999, overflow: 'hidden', margin: '4px 0' }}>
                    <div style={{ height: '100%', width: `${item.contributionPercent}%`, background: 'var(--color-primary)' }} />
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>{item.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--color-primary-light)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid #fed7aa' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9a3412', textTransform: 'uppercase' }}>Recommended Action</span>
            <div style={{ fontSize: '0.82rem', color: '#7c2d12', marginTop: 2 }}>{alert.recommendedAction}</div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          {alert.status === 'OPEN' && (
            <button 
              className="btn btn-primary"
              onClick={() => {
                onDispatchWorkOrder(alert);
                onClose();
              }}
            >
              Schedule Repair
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
