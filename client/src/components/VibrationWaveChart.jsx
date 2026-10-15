import React, { useState, useEffect } from 'react';
import { TrendingUp, Maximize2, Minimize2 } from 'lucide-react';
import { api } from '../services/api';

export const VibrationWaveChart = ({ 
  machines = [], 
  selectedMachineId, 
  onSelectMachine,
  liveStream = []
}) => {
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [zoomMode, setZoomMode] = useState('auto'); // 'auto' | 'full'

  const targetMachineId = selectedMachineId || machines[0]?.machineId || 'MCH-CNC-501';
  const targetMachine = machines.find(m => m.machineId === targetMachineId) || machines[0];

  // Fetch telemetry history on machine change
  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await api.getTelemetry(targetMachineId);
        if (res.success && isMounted && Array.isArray(res.data) && res.data.length > 0) {
          setTelemetryHistory(res.data);
        } else if (isMounted) {
          // If no history exists yet, generate clean continuous baseline
          const mockSeed = Array.from({ length: 25 }, (_, i) => ({
            timestamp: new Date(Date.now() - (25 - i) * 1000).toISOString(),
            machineId: targetMachineId,
            vibrationRms: +(1.8 + Math.sin(i * 0.3) * 0.28).toFixed(2),
            tempC: 52.0,
            bearingPeakG: 0.85
          }));
          setTelemetryHistory(mockSeed);
        }
      } catch (err) {
        console.error('Failed to load telemetry history:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHistory();
    return () => { isMounted = false; };
  }, [targetMachineId]);

  // Smoothly append new live readings to maintain continuous wave without shrinking buffer
  useEffect(() => {
    if (!Array.isArray(liveStream) || liveStream.length === 0) return;
    const newest = liveStream[liveStream.length - 1];
    if (!newest || newest.machineId !== targetMachineId) return;

    setTelemetryHistory(prev => {
      if (!prev || prev.length === 0) return [newest];
      const last = prev[prev.length - 1];
      if (last && ((last._id != null && last._id === newest._id) || last.timestamp === newest.timestamp)) {
        return prev;
      }
      return [...prev.slice(-29), newest];
    });
  }, [liveStream, targetMachineId]);

  // Chart dimensions matching Hydrogen project exactly
  const width = 640;
  const height = 180;
  const padding = { top: 22, right: 30, bottom: 30, left: 52 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Compute Stable Scales (Stable rounded steps prevent jarring scale jumps)
  const vibrations = telemetryHistory.map(d => d.vibrationRms ?? 1.8);
  const dataMin = vibrations.length > 0 ? Math.min(...vibrations) : (targetMachine?.currentVibrationRms || 1.8);
  const dataMax = vibrations.length > 0 ? Math.max(...vibrations) : (targetMachine?.currentVibrationRms || 1.8);

  let minV, maxV;
  if (zoomMode === 'auto') {
    const targetMin = Math.max(0, dataMin - 0.6);
    const targetMax = Math.max(targetMin + 3.0, dataMax + 0.6);
    minV = Math.floor(targetMin * 2) / 2;
    maxV = Math.ceil(targetMax * 2) / 2;
  } else {
    // Full scale 0 to 10 mm/s
    minV = 0;
    maxV = Math.max(10.0, Math.ceil(dataMax + 1.0));
  }

  if (maxV <= minV) maxV = minV + 2;

  const getX = (index) => {
    if (telemetryHistory.length <= 1) return padding.left;
    return padding.left + (index / (telemetryHistory.length - 1)) * innerWidth;
  };

  const getY = (val) => {
    const range = maxV - minV || 1;
    const clamped = Math.min(maxV, Math.max(minV, val));
    return padding.top + innerHeight - ((clamped - minV) / range) * innerHeight;
  };

  // Build Smooth Cubic Bezier Spline Path
  const buildSmoothPath = (points) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? i : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  };

  const svgCoords = telemetryHistory.map((d, i) => ({
    x: getX(i),
    y: getY(d.vibrationRms ?? 1.8),
    vibration: d.vibrationRms ?? 1.8,
    temp: d.tempC,
    timestamp: d.timestamp
  }));

  const smoothLinePath = buildSmoothPath(svgCoords);
  const smoothAreaPath = svgCoords.length > 0
    ? `${smoothLinePath} L ${svgCoords[svgCoords.length - 1].x} ${padding.top + innerHeight} L ${svgCoords[0].x} ${padding.top + innerHeight} Z`
    : '';

  // Warning threshold
  const warningLimit = targetMachine?.warningVibrationRms || 4.5;
  const isWarningInView = warningLimit >= minV && warningLimit <= maxV;
  const warningY = getY(warningLimit);
  const isBreached = (targetMachine?.currentVibrationRms || 0) >= warningLimit;

  const currentHoverPoint = hoverIndex !== null && telemetryHistory[hoverIndex]
    ? telemetryHistory[hoverIndex]
    : telemetryHistory[telemetryHistory.length - 1];

  // Grid tick values (4 steps)
  const yTicks = [
    minV,
    +((minV + (maxV - minV) * 0.33).toFixed(1)),
    +((minV + (maxV - minV) * 0.66).toFixed(1)),
    maxV
  ];

  return (
    <div className="panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="panel-header" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={18} style={{ color: isBreached ? 'var(--color-danger)' : 'var(--color-primary)' }} />
          <div>
            <div className="panel-title">Live Machine Vibration Wave</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
              Real-time vibration velocity with dynamic auto-scaling
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Zoom Mode Toggle */}
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setZoomMode(zoomMode === 'auto' ? 'full' : 'auto')}
            style={{ padding: '3px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}
            title={zoomMode === 'auto' ? 'Switch to Full 0-10 mm/s Scale' : 'Switch to Auto-Zoom Wave'}
          >
            {zoomMode === 'auto' ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
            <span>{zoomMode === 'auto' ? 'Zoom Wave' : 'Full Scale'}</span>
          </button>

          {/* Target Machine Picker */}
          <select 
            className="form-input"
            value={targetMachineId}
            onChange={e => onSelectMachine && onSelectMachine(e.target.value)}
            style={{ 
              padding: '3px 8px', 
              fontSize: '0.78rem', 
              fontWeight: 700, 
              background: '#f8fafc',
              borderColor: 'var(--border-color)',
              borderRadius: 6
            }}
          >
            {machines.map(m => (
              <option key={m.machineId} value={m.machineId}>
                {m.machineId} ({m.currentVibrationRms} mm/s)
              </option>
            ))}
          </select>

          {/* Highlight Badge */}
          <span 
            className="mono" 
            style={{ 
              fontSize: '0.8rem', 
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: 6,
              background: isBreached ? '#fef2f2' : '#f0fdf4',
              color: isBreached ? '#b91c1c' : '#15803d',
              border: `1px solid ${isBreached ? '#fecaca' : '#bbf7d0'}`
            }}
          >
            {targetMachine?.currentVibrationRms?.toFixed(2)} mm/s
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="panel-body" style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: '100%', position: 'relative' }}>
          <svg 
            viewBox={`0 0 ${width} ${height}`} 
            style={{ width: '100%', height: 'auto', overflow: 'visible', userSelect: 'none' }}
          >
            <defs>
              <linearGradient id="vibGradientNominal" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.38" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.02" />
              </linearGradient>

              <linearGradient id="vibGradientCritical" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines & Y-Axis Labels */}
            {yTicks.map((val, idx) => {
              const yPos = getY(val);
              return (
                <g key={idx}>
                  <line 
                    x1={padding.left} 
                    y1={yPos} 
                    x2={width - padding.right} 
                    y2={yPos} 
                    stroke="#e2e8f0" 
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text 
                    x={padding.left - 6} 
                    y={yPos + 3.5} 
                    textAnchor="end" 
                    fontSize="9.5" 
                    fill="#94a3b8" 
                    fontFamily="monospace"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Warning Envelope Reference Line if in current view */}
            {isWarningInView && (
              <g>
                <line 
                  x1={padding.left} 
                  y1={warningY} 
                  x2={width - padding.right} 
                  y2={warningY} 
                  stroke="#ef4444" 
                  strokeDasharray="6 4"
                  strokeWidth="1.5"
                />
                <text 
                  x={width - padding.right - 4} 
                  y={warningY - 5} 
                  textAnchor="end" 
                  fontSize="9" 
                  fill="#ef4444" 
                  fontWeight="700" 
                  fontFamily="monospace"
                >
                  WARNING LIMIT: {warningLimit} MM/S
                </text>
              </g>
            )}

            {/* Smooth Wave Area Fill */}
            {smoothAreaPath && (
              <path 
                d={smoothAreaPath} 
                fill={isBreached ? 'url(#vibGradientCritical)' : 'url(#vibGradientNominal)'} 
              />
            )}

            {/* Smooth Wave Line */}
            {smoothLinePath && (
              <path 
                d={smoothLinePath} 
                fill="none" 
                stroke={isBreached ? '#ef4444' : '#0284c7'} 
                strokeWidth="2.75" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            )}

            {/* Interactive Data Points */}
            {svgCoords.map((pt, i) => {
              const isHovered = hoverIndex === i;
              const isLast = i === svgCoords.length - 1;

              return (
                <g key={i}>
                  {/* Pulsing ring on latest reading */}
                  {isLast && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="7"
                      fill="none"
                      stroke={isBreached ? '#ef4444' : '#0284c7'}
                      strokeWidth="1.5"
                      opacity="0.6"
                    />
                  )}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 5.5 : isLast ? 4 : 2.5}
                    fill={isBreached ? '#ef4444' : '#0284c7'}
                    stroke="#ffffff"
                    strokeWidth={isHovered || isLast ? 2 : 1}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoverIndex(i)}
                    onMouseLeave={() => setHoverIndex(null)}
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Footer Metric Legend Bar */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          paddingTop: 8, 
          marginTop: 'auto',
          borderTop: '1px solid #f1f5f9',
          fontSize: '0.74rem',
          color: 'var(--text-dim)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 3, background: '#0284c7', borderRadius: 2 }} />
              <span>Vibration Wave (mm/s)</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 2, background: '#ef4444', borderTop: '2px dashed #ef4444' }} />
              <span>Warning: {warningLimit} mm/s</span>
            </span>
          </div>

          <div className="mono" style={{ fontSize: '0.72rem' }}>
            <span>Sample: </span>
            <strong style={{ color: 'var(--text-main)' }}>
              {currentHoverPoint ? `${(currentHoverPoint.vibrationRms ?? 1.8).toFixed(2)} mm/s @ ${new Date(currentHoverPoint.timestamp || Date.now()).toLocaleTimeString()}` : 'Live Wave'}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};
