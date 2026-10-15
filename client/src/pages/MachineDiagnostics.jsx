import React, { useState } from 'react';
import { Cpu, Search, Filter, Wrench } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const MachineDiagnostics = ({ machines, onOpenWorkOrderModal }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const filtered = machines.filter(m => {
    if (filterType !== 'ALL' && m.type !== filterType) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        m.name.toLowerCase().includes(term) ||
        m.machineId.toLowerCase().includes(term) ||
        m.line.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="panel" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexGrow: 1, maxWidth: 360 }}>
            <Search size={16} style={{ color: 'var(--text-dim)' }} />
            <input 
              type="text"
              placeholder="Search machine ID, model, cell..."
              className="form-input"
              style={{ width: '100%' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Equipment Class:</span>
            <select 
              className="form-input"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
            >
              <option value="ALL">All Machinery</option>
              <option value="SPINDLE_MOTOR">Spindle Motors</option>
              <option value="CENTRIFUGAL_COMPRESSOR">Compressors & Fans</option>
              <option value="HYDRAULIC_PUMP">Hydraulic Pumps</option>
              <option value="ROBOTIC_GEARBOX">Gearboxes & Drives</option>
            </select>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Cpu size={18} style={{ color: 'var(--color-primary)' }} />
            <span>All Machines & Sensor Status ({filtered.length})</span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Machine ID</th>
                <th>Type</th>
                <th>Health</th>
                <th>Remaining Life</th>
                <th>Vibration</th>
                <th>Bearing Wear</th>
                <th>Temp</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.machineId}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{m.name}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{m.line}</div>
                  </td>
                  <td>
                    <span className="badge badge-info">{m.type.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="mono" style={{ fontWeight: 700 }}>
                    <span style={{ color: m.healthScore < 60 ? 'var(--color-danger)' : m.healthScore < 80 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                      {m.healthScore}%
                    </span>
                  </td>
                  <td className="mono">
                    <strong>{m.predictedRulHours}h</strong>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>[{m.rulConfidenceMin}-{m.rulConfidenceMax}h]</div>
                  </td>
                  <td className="mono" style={{ fontWeight: m.currentVibrationRms > m.warningVibrationRms ? 700 : 400 }}>
                    <span style={{ color: m.currentVibrationRms > m.warningVibrationRms ? 'var(--color-danger)' : 'inherit' }}>
                      {m.currentVibrationRms} mm/s
                    </span>
                  </td>
                  <td className="mono">{m.currentBearingPeakG} g</td>
                  <td className="mono">{m.currentTempC}°C</td>
                  <td><StatusBadge status={m.status} /></td>
                  <td>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => onOpenWorkOrderModal(m.machineId)}
                    >
                      <Wrench size={13} />
                      <span>Schedule Repair</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
