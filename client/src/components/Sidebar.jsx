import React from 'react';
import { 
  LayoutDashboard, 
  Cpu, 
  Hourglass, 
  AlertTriangle, 
  Wrench, 
  TrendingUp, 
  Activity 
} from 'lucide-react';

export const Sidebar = ({ currentTab, setCurrentTab, alertCount = 0, criticalRulCount = 0 }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'machines', label: 'Machines', icon: Cpu },
    { id: 'rul', label: 'Remaining Life', icon: Hourglass, badge: criticalRulCount },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, badge: alertCount },
    { id: 'workorders', label: 'Repairs & Tasks', icon: Wrench },
    { id: 'trends', label: 'Live Charts', icon: TrendingUp }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-badge">
          <Activity size={20} />
        </div>
        <div>
          <div className="brand-title">Equipment Health</div>
          <div className="brand-subtitle">Maintenance Monitor</div>
        </div>
      </div>

      <nav className="nav-links">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setCurrentTab(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="nav-badge badge-severe-anomaly">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: 2 }}>System Active</div>
        <div>6 Machines Monitored</div>
      </div>
    </aside>
  );
};
