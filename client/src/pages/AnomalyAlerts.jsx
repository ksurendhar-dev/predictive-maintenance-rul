import React from 'react';
import { AlertTriangle, CheckCircle, ChevronRight, Check } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const AnomalyAlerts = ({ alerts = [], onAcknowledgeAlert, onResolveAlert, onExplainAlert }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="panel" style={{ padding: 16 }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Equipment Alerts</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Automatic alerts detecting abnormal vibration, bearing wear, and temperature spikes.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 18 }}>
        {alerts.map(alert => (
          <div key={alert.alertId} className="panel">
            <div className="panel-header" style={{ alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className="mono" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)' }}>
                    {alert.alertId}
                  </span>
                  <StatusBadge status={alert.severity} />
                  <StatusBadge status={alert.status} />
                </div>
                <h3 style={{ fontSize: '0.94rem', fontWeight: 700 }}>{alert.failureMode}</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Machine: <strong>{alert.machineName}</strong> ({alert.line})
                </div>
              </div>
            </div>

            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: '#f8fafc', padding: 10, borderRadius: 6, display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', border: '1px solid var(--border-color)' }}>
                <span>Risk Level:</span>
                <strong className="mono" style={{ color: 'var(--color-danger)' }}>
                  {(alert.anomalyScore * 100).toFixed(0)}%
                </strong>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                <strong>Recommended Action:</strong> {alert.recommendedAction}
              </div>

              {/* Explainability Mini-List */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 8 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Key Factors:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                  {alert.explainability?.map((item, idx) => (
                    <span key={idx} className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                      {item.feature}: {item.contributionPercent}%
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ padding: '12px 18px', background: '#fafafa', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {!alert.acknowledged && alert.status !== 'RESOLVED' && (
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => onAcknowledgeAlert(alert.alertId)}
                    title="Acknowledge alert notification"
                  >
                    <CheckCircle size={13} />
                    <span>Acknowledge</span>
                  </button>
                )}

                {alert.status !== 'RESOLVED' ? (
                  <button 
                    className="btn btn-sm"
                    onClick={() => onResolveAlert && onResolveAlert(alert.alertId)}
                    style={{ background: '#059669', color: '#ffffff', border: 'none', display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: '0.76rem', borderRadius: 4, cursor: 'pointer' }}
                    title="Mark resolved and restore nominal machine baseline"
                  >
                    <Check size={13} />
                    <span>Resolve Alert</span>
                  </button>
                ) : (
                  <span style={{ fontSize: '0.76rem', color: 'var(--color-success)', fontWeight: 600 }}>
                    Resolved
                  </span>
                )}
              </div>

              <button 
                className="btn btn-primary btn-sm"
                onClick={() => onExplainAlert(alert)}
              >
                <span>Details & Explanation</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
