import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { VibrationWaveChart } from '../components/VibrationWaveChart';
import { api } from '../services/api';

export const TelemetryTrends = ({ machines = [] }) => {
  const [selectedMachineId, setSelectedMachineId] = useState(machines[0]?.machineId || 'MCH-CNC-501');
  const [telemetry, setTelemetry] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadTelemetry = async (id) => {
    setLoading(true);
    try {
      const res = await api.getTelemetry(id);
      if (res.success) setTelemetry(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMachineId) {
      loadTelemetry(selectedMachineId);
    }
  }, [selectedMachineId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Dynamic Wave Chart Styled Identically to Hydrogen Storage System */}
      <VibrationWaveChart 
        machines={machines}
        selectedMachineId={selectedMachineId}
        onSelectMachine={id => setSelectedMachineId(id)}
      />

      {/* Sensor Log Table */}
      <div className="panel">
        <div className="panel-header" style={{ justifyContent: 'space-between' }}>
          <div className="panel-title">
            <Activity size={18} style={{ color: 'var(--color-primary)' }} />
            <span>Sensor Readings Log ({selectedMachineId})</span>
          </div>

          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => loadTelemetry(selectedMachineId)}
            disabled={loading}
            style={{ padding: '4px 10px', fontSize: '0.74rem' }}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Table</span>
          </button>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Vibration</th>
                <th>Bearing Peak (g)</th>
                <th>Temp (°C)</th>
                <th>Acoustic (dB)</th>
                <th>Current (A)</th>
                <th>Speed (RPM)</th>
                <th>Alert Flag</th>
              </tr>
            </thead>
            <tbody>
              {telemetry.slice(-10).reverse().map((t, idx) => (
                <tr key={idx}>
                  <td className="mono" style={{ fontSize: '0.78rem' }}>
                    {new Date(t.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="mono" style={{ fontWeight: 600 }}>{t.vibrationRms} mm/s</td>
                  <td className="mono">{t.bearingPeakG} g</td>
                  <td className="mono">{t.tempC}°C</td>
                  <td className="mono">{t.acousticEmissionDb} dB</td>
                  <td className="mono">{t.motorCurrentAmps} A</td>
                  <td className="mono">{t.rpm}</td>
                  <td>
                    {t.anomalyFlag ? (
                      <span className="badge badge-severe-anomaly" style={{ fontSize: '0.7rem' }}>ANOMALY</span>
                    ) : (
                      <span className="badge badge-healthy" style={{ fontSize: '0.7rem' }}>NORMAL</span>
                    )}
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
