import React from 'react';
import { Wrench, CheckCircle2, Clock, PackageCheck } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const WorkOrders = ({ workOrders, onUpdateWorkOrderStatus, onOpenWorkOrderModal }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="panel" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Equipment Repairs & Tasks</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Scheduled maintenance and repair tasks for equipment.
            </p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => onOpenWorkOrderModal()}>
            <span>Schedule Repair</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 18 }}>
        {workOrders.map(wo => (
          <div key={wo.workOrderId} className="panel">
            <div className="panel-header" style={{ alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className="mono" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {wo.workOrderId}
                  </span>
                  <StatusBadge status={wo.priority} />
                  <StatusBadge status={wo.status} />
                </div>
                <h3 style={{ fontSize: '0.94rem', fontWeight: 700 }}>{wo.title}</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Equipment: <strong>{wo.machineName}</strong>
                </div>
              </div>
            </div>

            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: '#f8fafc', padding: 10, borderRadius: 6, fontSize: '0.78rem', border: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>Assigned Team:</span>
                  <div style={{ fontWeight: 600 }}>{wo.assignedTeam}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>Target Date:</span>
                  <div className="mono" style={{ fontWeight: 600 }}>{new Date(wo.scheduledDate).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Parts */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Required Replacement Parts & Kitting
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {wo.partsRequired?.map((p, idx) => (
                    <div key={idx} style={{ fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', background: '#fafafa', padding: '4px 8px', borderRadius: 4 }}>
                      <span>{p.name} (<span className="mono">{p.partNumber}</span>)</span>
                      <span className="badge badge-healthy" style={{ fontSize: '0.68rem' }}>IN STOCK</span>
                    </div>
                  ))}
                </div>
              </div>

              {wo.notes && (
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontStyle: 'italic', background: '#fafafa', padding: 8, borderRadius: 4 }}>
                  "{wo.notes}"
                </div>
              )}
            </div>

            <div style={{ padding: '12px 18px', background: '#fafafa', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              {wo.status === 'DISPATCHED' && (
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => onUpdateWorkOrderStatus(wo.workOrderId, 'IN_PROGRESS')}
                >
                  <Clock size={13} />
                  <span>Start Work</span>
                </button>
              )}

              {wo.status !== 'COMPLETED' && (
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => onUpdateWorkOrderStatus(wo.workOrderId, 'COMPLETED')}
                >
                  <CheckCircle2 size={13} />
                  <span>Sign Off Complete</span>
                </button>
              )}

              {wo.status === 'COMPLETED' && (
                <span style={{ fontSize: '0.78rem', color: 'var(--color-success)', fontWeight: 600 }}>
                  Closed & Maintenance Logged
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
