import React from 'react';
import { PlusCircle, Activity } from 'lucide-react';

export const Header = ({ title, onOpenWorkOrderModal }) => {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="page-heading">{title}</h1>
        <div className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Activity size={13} />
          <span>Live Monitoring Active</span>
        </div>
      </div>

      <div className="topbar-right">
        <button 
          className="btn btn-primary btn-sm"
          onClick={onOpenWorkOrderModal}
        >
          <PlusCircle size={15} />
          <span>Schedule Repair</span>
        </button>
      </div>
    </header>
  );
};
