import React from 'react';

export const MetricCard = ({ label, value, unit = '', subtext, icon: Icon, badgeText, badgeType }) => {
  return (
    <div className="metric-card">
      <div className="metric-card-header">
        <span className="metric-label">{label}</span>
        {Icon && (
          <div className="metric-icon-wrap">
            <Icon size={16} />
          </div>
        )}
      </div>
      <div className="metric-value mono">
        {value} <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-muted)' }}>{unit}</span>
      </div>
      <div className="metric-subtext">
        {badgeText && (
          <span className={`badge ${badgeType ? `badge-${badgeType}` : 'badge-info'}`} style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
            {badgeText}
          </span>
        )}
        <span>{subtext}</span>
      </div>
    </div>
  );
};
