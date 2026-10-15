import React from 'react';
import { Hourglass, AlertCircle, CheckCircle2, Wrench } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const RULPredictions = ({ machines, onOpenWorkOrderModal }) => {
  const sorted = [...machines].sort((a, b) => a.predictedRulHours - b.predictedRulHours);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="panel" style={{ padding: 16 }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Estimated Machine Operating Life</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Estimated working hours remaining before routine service or part replacement is needed.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 18 }}>
        {sorted.map(m => {
          const isUrgent = m.predictedRulHours <= 100;
          const isWarning = m.predictedRulHours <= 300;

          return (
            <div 
              key={m.machineId}
              className="panel"
              style={{ borderColor: isUrgent ? 'var(--color-danger-border)' : isWarning ? 'var(--color-warning-border)' : 'var(--border-color)' }}
            >
              <div className="panel-header" style={{ alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="mono" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)' }}>
                      {m.machineId}
                    </span>
                    <StatusBadge status={m.status} />
                  </div>
                  <h3 style={{ fontSize: '0.96rem', fontWeight: 700 }}>{m.name}</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.line}</div>
                </div>
              </div>

              <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* RUL Big Metric */}
                <div style={{ 
                  background: isUrgent ? 'var(--color-danger-bg)' : isWarning ? 'var(--color-warning-bg)' : '#f8fafc',
                  padding: 14,
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${isUrgent ? 'var(--color-danger-border)' : isWarning ? 'var(--color-warning-border)' : 'var(--border-color)'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600 }}>
                      Estimated Life Remaining
                    </span>
                    <div className="mono" style={{ 
                      fontSize: '1.4rem', 
                      fontWeight: 800, 
                      color: isUrgent ? 'var(--color-danger)' : isWarning ? 'var(--color-warning)' : 'var(--color-success)' 
                    }}>
                      {m.predictedRulHours} Hours
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>95% Confidence Interval</span>
                    <div className="mono" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      {m.rulConfidenceMin}h - {m.rulConfidenceMax}h
                    </div>
                  </div>
                </div>

                {/* Operating Parameter Telemetry */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.78rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Vibration Level:</span>
                    <div className="mono" style={{ fontWeight: 600 }}>{m.currentVibrationRms} mm/s</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Total Cumulative Run:</span>
                    <div className="mono" style={{ fontWeight: 600 }}>{m.totalOperatingHours.toLocaleString()}h</div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '12px 18px', background: '#fafafa', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.76rem', color: isUrgent ? 'var(--color-danger)' : 'var(--text-dim)', fontWeight: 600 }}>
                  {isUrgent ? 'Imminent Failure Risk' : isWarning ? 'Service Window Open' : 'Normal Operation'}
                </span>
                <button 
                  className={`btn btn-sm ${isUrgent ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => onOpenWorkOrderModal(m.machineId)}
                >
                  <Wrench size={13} />
                  <span>Schedule Service</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
