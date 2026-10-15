import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';

export const SimulationCockpit = ({ onTriggerScenario, isConnected = true }) => {
  const [activeScenario, setActiveScenario] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleAction = async (scenarioKey) => {
    try {
      setErrorMessage(null);
      setLoadingAction(scenarioKey);
      setActiveScenario(scenarioKey);
      await onTriggerScenario(scenarioKey);
    } catch (err) {
      console.error(`Simulation action error:`, err.message);
      setErrorMessage(err.message || 'Action failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const scenarios = [
    { key: 'VIBRATION_SPIKE', label: 'Vib Spike', dotColor: '#ef4444', desc: 'Simulate severe vibration spike (8.6 mm/s)' },
    { key: 'BEARING_DEFECT', label: 'Bearing Defect', dotColor: '#f59e0b', desc: 'Simulate bearing outer race defect (5.2g)' },
    { key: 'RUL_COLLAPSE', label: 'RUL Drop', dotColor: '#dc2626', desc: 'Simulate accelerated RUL degradation' }
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
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          padding: '3px 6px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
          flexWrap: 'wrap'
        }}
      >
        {/* Status Dot */}
        <span 
          style={{ 
            width: 7, 
            height: 7, 
            borderRadius: '50%', 
            background: isConnected ? '#10b981' : '#f59e0b',
            boxShadow: isConnected ? '0 0 6px rgba(16, 185, 129, 0.5)' : 'none',
            marginLeft: 2,
            marginRight: 2
          }} 
          title={isConnected ? 'Simulator Connected' : 'Connecting to Simulator...'}
        />

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {scenarios.map((sc) => {
            const isLoading = loadingAction === sc.key;
            const isActive = activeScenario === sc.key;

            return (
              <button
                key={sc.key}
                onClick={() => handleAction(sc.key)}
                disabled={!!loadingAction}
                title={sc.desc}
                style={{
                  background: isActive ? '#f1f5f9' : '#ffffff',
                  border: `1px solid ${isActive ? '#94a3b8' : 'var(--border-color)'}`,
                  borderRadius: 6,
                  padding: '4px 9px',
                  color: isActive ? '#0f172a' : '#334155',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: loadingAction ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  transition: 'all 0.15s ease'
                }}
              >
                <span 
                  style={{ 
                    width: 6, 
                    height: 6, 
                    borderRadius: '50%', 
                    background: sc.dotColor 
                  }} 
                />
                <span>{isLoading ? 'Triggering...' : sc.label}</span>
              </button>
            );
          })}

          {/* Reset Fleet Button */}
          <button
            onClick={() => handleAction('RESET')}
            disabled={!!loadingAction}
            title="Restore all machines to nominal healthy baseline"
            style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: 6,
              padding: '4px 10px',
              color: '#065f46',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: loadingAction ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              transition: 'all 0.15s ease'
            }}
          >
            <RotateCcw size={12} />
            <span>Reset Fleet</span>
          </button>
        </div>

        {errorMessage && (
          <span style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 600, paddingLeft: 4 }}>
            {errorMessage}
          </span>
        )}
      </div>
    </aside>
  );
};
