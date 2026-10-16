import React from 'react';
import { PlusCircle, Activity, LogOut } from 'lucide-react';

export const Header = ({ title, onOpenWorkOrderModal, currentUser, onSignOut }) => {
  const canScheduleRepair = currentUser?.role !== 'OPERATOR';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="page-heading">{title}</h1>
        <div className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Activity size={13} />
          <span>Live Monitoring Active</span>
        </div>
      </div>

      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {canScheduleRepair && (
          <button 
            className="btn btn-primary btn-sm"
            onClick={onOpenWorkOrderModal}
          >
            <PlusCircle size={15} />
            <span>Schedule Repair</span>
          </button>
        )}

        {currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8, borderLeft: '1px solid var(--border-color)' }}>
            <span 
              className="badge" 
              style={{ 
                fontSize: '0.72rem',
                fontWeight: 700,
                background: currentUser.role === 'ADMIN' ? '#fff7ed' : currentUser.role === 'TECHNICIAN' ? '#f0f9ff' : '#ecfdf5',
                color: currentUser.role === 'ADMIN' ? '#ea580c' : currentUser.role === 'TECHNICIAN' ? '#0284c7' : '#059669',
                border: `1px solid ${currentUser.role === 'ADMIN' ? '#fed7aa' : currentUser.role === 'TECHNICIAN' ? '#bae6fd' : '#a7f3d0'}`
              }}
            >
              {currentUser.role}
            </span>

            <button
              className="btn btn-secondary btn-sm"
              onClick={onSignOut}
              title="Sign Out"
              style={{ padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
