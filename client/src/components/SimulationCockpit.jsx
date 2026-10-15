import React, { useState, useEffect, useRef } from 'react';
import { 
  GripHorizontal, 
  ChevronDown, 
  ChevronUp,
  RotateCcw,
  Activity,
  Zap
} from 'lucide-react';

export const SimulationCockpit = ({ onTriggerScenario, isConnected = true }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeScenario, setActiveScenario] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('Cockpit ready. Drag to reposition.');
  const [loadingAction, setLoadingAction] = useState(null);

  const [position, setPosition] = useState({ x: 0, y: 14 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });
  const barRef = useRef(null);

  useEffect(() => {
    if (barRef.current && position.x === 0) {
      const barWidth = barRef.current.offsetWidth || 760;
      const initialX = Math.max(16, Math.round((window.innerWidth - barWidth) / 2));
      setPosition({ x: initialX, y: 14 });
    }
  }, []);

  const handleMouseDown = (e) => {
    if (e.target.closest('button')) return;
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: position.x,
      posY: position.y
    };
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - dragStartRef.current.mouseX;
      const deltaY = e.clientY - dragStartRef.current.mouseY;

      const barWidth = barRef.current ? barRef.current.offsetWidth : 720;
      const barHeight = barRef.current ? barRef.current.offsetHeight : 44;

      const maxX = Math.max(0, window.innerWidth - barWidth - 10);
      const maxY = Math.max(0, window.innerHeight - barHeight - 10);

      const newX = Math.min(Math.max(10, dragStartRef.current.posX + deltaX), maxX);
      const newY = Math.min(Math.max(10, dragStartRef.current.posY + deltaY), maxY);

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

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
      ref={barRef}
      aria-label="Simulation Cockpit"
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        zIndex: 9999,
        userSelect: 'none',
        transition: isDragging ? 'none' : 'box-shadow 0.2s ease',
        boxShadow: isDragging 
          ? '0 20px 40px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.15)' 
          : '0 10px 25px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)'
      }}
    >
      <div 
        style={{
          background: 'rgba(9, 13, 20, 0.95)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          borderRadius: 24,
          padding: '6px 14px',
          color: '#f1f5f9',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        }}
      >
        {/* Minimal Drag Handle & Label */}
        <div 
          onMouseDown={handleMouseDown}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            cursor: isDragging ? 'grabbing' : 'grab',
            padding: '4px 6px',
            borderRadius: 6
          }}
          title="Drag to reposition cockpit"
        >
          <GripHorizontal size={13} style={{ color: 'rgba(255, 255, 255, 0.35)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span 
              style={{ 
                width: 6, 
                height: 6, 
                borderRadius: '50%', 
                background: isConnected ? '#10b981' : '#f59e0b',
                boxShadow: isConnected ? '0 0 6px rgba(16, 185, 129, 0.8)' : 'none'
              }} 
            />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', color: '#cbd5e1' }}>
              SIMULATION COCKPIT
            </span>
          </div>
        </div>

        {/* Vertical divider */}
        <div style={{ width: 1, height: 16, background: 'rgba(255, 255, 255, 0.12)' }} />

        {/* Collapsed vs Expanded */}
        {!isCollapsed ? (
          <>
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
                      background: isActive ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)'}`,
                      borderRadius: 14,
                      padding: '4px 9px',
                      color: isActive ? '#ffffff' : '#94a3b8',
                      fontSize: '0.72rem',
                      fontWeight: 500,
                      cursor: loadingAction ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!loadingAction) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.color = '#ffffff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loadingAction && !isActive) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                        e.currentTarget.style.color = '#94a3b8';
                      }
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
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 14,
                  padding: '4px 10px',
                  color: '#34d399',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: loadingAction ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  transition: 'all 0.15s ease'
                }}
              >
                <RotateCcw size={11} />
                <span>Reset Fleet</span>
              </button>
            </div>

            {/* Status Ticker */}
            <div 
              style={{ 
                maxWidth: 240, 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap',
                fontSize: '0.68rem',
                color: '#64748b',
                fontFamily: 'monospace',
                paddingLeft: 4
              }}
              title={feedbackMsg}
            >
              {feedbackMsg}
            </div>
          </>
        ) : (
          <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Collapsed</span>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.4)',
            cursor: 'pointer',
            padding: 2,
            display: 'flex',
            alignItems: 'center'
          }}
          title={isCollapsed ? 'Expand cockpit' : 'Collapse cockpit'}
        >
          {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>
    </aside>
  );
};
