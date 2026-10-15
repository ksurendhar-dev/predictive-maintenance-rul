import React, { useState } from 'react';
import { X, Wrench, Send } from 'lucide-react';

export const WorkOrderModal = ({ machines, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    machineId: machines[0]?.machineId || '',
    title: '',
    priority: 'HIGH',
    assignedTeam: 'Precision Vibration & Reliability Team',
    scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    estimatedDowntimeHours: 4,
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) return;
    setLoading(true);
    await onSubmit(formData);
    setLoading(false);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Wrench size={18} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Schedule Equipment Repair</h3>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Select Machine</label>
              <select 
                className="form-input"
                value={formData.machineId}
                onChange={e => setFormData({ ...formData, machineId: e.target.value })}
              >
                {machines.map(m => (
                  <option key={m.machineId} value={m.machineId}>
                    {m.machineId} - {m.name} (RUL: {m.predictedRulHours}h)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Repair Task Title</label>
              <input 
                type="text" 
                className="form-input"
                placeholder="e.g. Replace Spindle Bearings"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Priority Tier</label>
                <select 
                  className="form-input"
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High Priority</option>
                  <option value="URGENT">Urgent (Imminent RUL Expiry)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Target Execution Date</label>
                <input 
                  type="date" 
                  className="form-input"
                  value={formData.scheduledDate}
                  onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Assigned Maintenance Team</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={formData.assignedTeam}
                  onChange={e => setFormData({ ...formData, assignedTeam: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Estimated Downtime (Hours)</label>
                <input 
                  type="number" 
                  className="form-input mono"
                  value={formData.estimatedDowntimeHours}
                  onChange={e => setFormData({ ...formData, estimatedDowntimeHours: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Technician Instructions & Failure Mode Context</label>
              <textarea 
                className="form-input"
                rows="2"
                placeholder="Include torque specifications, replacement part numbers, and lockout procedures..."
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Send size={14} />
              <span>{loading ? 'Scheduling...' : 'Save Scheduled Repair'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
