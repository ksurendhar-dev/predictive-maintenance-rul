import React, { useState } from 'react';
import { Cpu, AlertTriangle, Hourglass, Wrench, Activity, ChevronRight, Check, WrenchIcon } from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { VibrationWaveChart } from '../components/VibrationWaveChart';

export const FleetOverview = ({ 
  overview, 
  machines = [], 
  alerts = [], 
  telemetryStream = {},
  onExplainAlert, 
  onOpenWorkOrderModal,
  onResolveAlert 
}) => {
  const [selectedMachineId, setSelectedMachineId] = useState(null);

  const openAlerts = alerts.filter(a => a.status !== 'RESOLVED');

  // Focused machine: manual user selection takes priority, followed by latest open alert machine, then first unhealthy, then default
  const latestAlert = openAlerts[0];
  const chartMachineId = selectedMachineId || latestAlert?.machineId || (machines.find(m => m.status !== 'HEALTHY')?.machineId) || machines[0]?.machineId;
  const activeMachine = machines.find(m => m.machineId === chartMachineId) || machines[0];

  const currentStream = activeMachine ? (telemetryStream[activeMachine.machineId] || []) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 1. KPIs */}
      <div className="metrics-grid">
        <MetricCard 
          label="Overall Health" 
          value={`${overview?.avgHealth ?? 95}%`} 
          subtext="Average machine condition"
          icon={Cpu}
          badgeText="STABLE"
          badgeType="healthy"
        />

        <MetricCard 
          label="Active Alerts" 
          value={overview?.openAnomalies ?? openAlerts.length} 
          unit={overview?.criticalAnomalies ? `(${overview.criticalAnomalies} Critical)` : ''}
          subtext="Equipment warning notifications"
          icon={AlertTriangle}
          badgeText={overview?.criticalAnomalies > 0 ? 'URGENT' : 'NOMINAL'}
          badgeType={overview?.criticalAnomalies > 0 ? 'severe-anomaly' : 'healthy'}
        />

        <MetricCard 
          label="Needs Service Soon" 
          value={overview?.criticalRulCount ?? 0} 
          unit="Machines"
          subtext="Under 200 hours remaining"
          icon={Hourglass}
          badgeText="ATTENTION"
          badgeType="early-degradation"
        />

        <MetricCard 
          label="Scheduled Repairs" 
          value={overview?.activeWorkOrders ?? 4} 
          subtext="Repairs currently scheduled"
          icon={Wrench}
          badgeText="ACTIVE"
          badgeType="info"
        />
      </div>

      {/* 2. Critical Anomaly Alerts Banner */}
      {openAlerts.length > 0 && (
        <div className="panel" style={{ borderColor: '#fca5a5', flexShrink: 0 }}>
          <div className="panel-header" style={{ background: '#fef2f2' }}>
            <div className="panel-title" style={{ color: '#b91c1c' }}>
              <AlertTriangle size={18} />
              <span>Equipment Alerts ({openAlerts.length})</span>
            </div>
            <span style={{ fontSize: '0.78rem', color: '#991b1b' }}>
              Resolve warnings below or schedule repairs
            </span>
          </div>
          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ whiteSpace: 'nowrap' }}>Alert ID</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Machine</th>
                  <th>Severity</th>
                  <th>Issue Detected</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Risk Level</th>
                  <th>Recommended Fix</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {openAlerts.map(alert => (
                  <tr key={alert.alertId}>
                    <td className="mono" style={{ fontWeight: 600, whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{alert.alertId}</td>
                    <td style={{ fontWeight: 600, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{alert.machineName}</td>
                    <td style={{ verticalAlign: 'middle' }}><StatusBadge status={alert.severity} /></td>
                    <td style={{ maxWidth: 220, verticalAlign: 'middle', fontSize: '0.82rem', lineHeight: '1.4' }}>{alert.failureMode}</td>
                    <td className="mono" style={{ fontWeight: 700, color: 'var(--color-danger)', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      {(alert.anomalyScore * 100).toFixed(0)}%
                    </td>
                    <td style={{ maxWidth: 240, fontSize: '0.8rem', color: '#475569', verticalAlign: 'middle', lineHeight: '1.4' }}>
                      {alert.recommendedAction}
                    </td>
                    <td style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => onExplainAlert(alert)}
                          title="View root cause explainability chart"
                          style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                        >
                          <span>Explain</span>
                          <ChevronRight size={12} />
                        </button>

                        <button 
                          className="btn btn-sm"
                          onClick={() => onResolveAlert && onResolveAlert(alert.alertId)}
                          style={{ 
                            padding: '5px 10px', 
                            fontSize: '0.75rem', 
                            background: '#059669', 
                            color: '#ffffff', 
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                          title="Resolve alert and restore nominal machine baseline"
                        >
                          <Check size={12} />
                          <span>Resolve</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Real-Time Vibration Spline Wave Chart */}
      <VibrationWaveChart 
        machines={machines}
        selectedMachineId={chartMachineId}
        onSelectMachine={id => setSelectedMachineId(id)}
      />

      {/* 4. Fleet Health Roster Grid */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Activity size={18} style={{ color: 'var(--color-primary)' }} />
            <span>Equipment Fleet (6 Machines)</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Live readings updating every 3s — click any machine to focus chart
          </span>
        </div>
        <div className="panel-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {machines.map(m => {
              const isSelected = activeMachine?.machineId === m.machineId;

              return (
                <div 
                  key={m.machineId}
                  onClick={() => setSelectedMachineId(m.machineId)}
                  style={{ 
                    border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-md)', 
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    background: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.12)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>{m.machineId}</span>
                        <StatusBadge status={m.status} />
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.96rem', marginTop: 4 }}>{m.name}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{m.line}</div>
                    </div>
                  </div>

                  {/* Health Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Health</span>
                      <span className="mono" style={{ color: m.healthScore < 60 ? '#ef4444' : '#059669' }}>
                        {m.healthScore}%
                      </span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: '#f1f5f9', borderRadius: 9999, overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          width: `${m.healthScore}%`, 
                          background: m.healthScore < 60 ? 'var(--color-danger)' : m.healthScore < 80 ? 'var(--color-warning)' : 'var(--color-success)' 
                        }} 
                      />
                    </div>
                  </div>

                  {/* Telemetry Strip */}
                  <div style={{ 
                    background: '#f8fafc', 
                    padding: 10, 
                    borderRadius: 'var(--radius-sm)', 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 8,
                    fontSize: '0.76rem', 
                    border: '1px solid var(--border-color)' 
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-dim)' }}>Remaining Life</span>
                      <div className="mono" style={{ 
                        fontWeight: 700, 
                        color: m.predictedRulHours < 150 ? 'var(--color-danger)' : m.predictedRulHours < 400 ? 'var(--color-warning)' : 'var(--color-success)' 
                      }}>
                        {m.predictedRulHours}h
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)' }}>Vibration</span>
                      <div className="mono" style={{ fontWeight: 700, color: m.currentVibrationRms >= (m.warningVibrationRms || 4.5) ? '#ef4444' : '#0f172a' }}>
                        {m.currentVibrationRms} mm/s
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)' }}>Bearing Wear</span>
                      <div className="mono" style={{ fontWeight: 700 }}>
                        {m.currentBearingPeakG}g
                      </div>
                    </div>
                  </div>

                  {/* Action row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
                    <span style={{ fontSize: '0.72rem', color: isSelected ? 'var(--color-primary)' : 'var(--text-dim)', fontWeight: 600 }}>
                      {isSelected ? '● Focused on Wave Chart' : 'Click to Focus Chart'}
                    </span>

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenWorkOrderModal && onOpenWorkOrderModal(m.machineId);
                      }}
                      style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                    >
                      <WrenchIcon size={11} />
                      <span>Schedule Repair</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
