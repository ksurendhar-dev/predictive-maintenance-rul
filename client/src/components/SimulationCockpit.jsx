import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';

export const SimulationCockpit = ({ onTriggerScenario, isConnected = true, embedded = true }) => {
  const [activeScenario, setActiveScenario] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('Cockpit ready.');
  const [loadingAction, setLoadingAction] = useState(null);

  const handleAction = async (scenarioKey, label) => {
    try {
      setLoadingAction(scenarioKey);
      setActiveScenario(scenarioKey);
      setFeedbackMsg(`${label}...`);
      
      const res = await onTriggerScenario(scenarioKey);
      if (res?.message) {
        setFeedbackMsg(res.message);
      } else {
        setFeedbackMsg(`Applied: ${label}`);
      }
    } catch (err) {
      setFeedbackMsg(`Error: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const scenarios = [
    { key: 'VIBRATION_SPIKE', label: 'Vib Spike 8.6 mm/s', dotColor: '#ef4444', desc: 'ISO 10816 Zone D severe vibration' },
    { key: 'BEARING_DEFECT', label: 'Bearing Defect 5.2g', dotColor: '#f59e0b', desc: 'Outer race BPFO impact harmonics' },
    { key: 'RUL_COLLAPSE', label: 'RUL Drop 14h', dotColor: '#dc2626', desc: 'Accelerated fatigue degradation' }
  ];

  return (
    <aside 
      aria-label="Simulation Cockpit"
      style={{
        userSelect: 'none',
        display: 'inline-flex',
        alignItems: 'center'
      }}
    >
      <div 
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 20,
          padding: '4px 10px',
          color: '#f1f5f9',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 4 }}>
          <span 
            style={{ 
              width: 7, 
              height: 7, 
              borderRadius: '50%', 
              background: isConnected ? '#10b981' : '#f59e0b',
              boxShadow: isConnected ? '0 0 6px rgba(16, 185, 129, 0.8)' : 'none'
            }} 
          />
          <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.05em', color: '#cbd5e1' }}>
            SIMULATE FAULTS:
          </span>
        </div>

        {/* Quick Trigger Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {scenarios.map((sc) => {
            const isLoading = loadingAction === sc.key;
            const isActive = activeScenario === sc.key;

            return (
              <button
                key={sc.key}
                onClick={() => handleAction(sc.key, sc.label)}
                disabled={!!loadingAction}
                title={sc.desc}
                style={{
                  background: isActive ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.06)',
                  border: `1px solid ${isActive ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.12)'}`,
                  borderRadius: 12,
                  padding: '3px 8px',
                  color: isActive ? '#ffffff' : '#cbd5e1',
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  cursor: loadingAction ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  transition: 'all 0.15s ease'
                }}
              >
                <span 
                  style={{ 
                    width: 5, 
                    height: 5, 
                    borderRadius: '50%', 
                    background: sc.dotColor 
                  }} 
                />
                <span>{isLoading ? 'Triggering...' : sc.label}</span>
              </button>
            );
          })}

          {/* Reset Button */}
          <button
            onClick={() => handleAction('RESET', 'Reset Fleet')}
            disabled={!!loadingAction}
            title="Restore all machines to nominal healthy baseline (RUL ≥ 1,200h, health ≥ 95%)"
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: 12,
              padding: '3px 9px',
              color: '#34d399',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: loadingAction ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.15s ease'
            }}
          >
            <RotateCcw size={11} />
            <span>Reset Fleet</span>
          </button>
        </div>

        {/* Status Ticker */}
        {feedbackMsg && (
          <div 
            style={{ 
              maxWidth: 220, 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              fontSize: '0.68rem',
              color: '#94a3b8',
              fontFamily: 'monospace',
              paddingLeft: 6,
              borderLeft: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            title={feedbackMsg}
          >
            {feedbackMsg}
          </div>
        )}
      </div>
    </aside>
  );
};
