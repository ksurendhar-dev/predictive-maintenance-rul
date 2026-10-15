import React from 'react';

export const StatusBadge = ({ status }) => {
  const normalized = (status || '').toLowerCase().replace(/_/g, '-');
  let badgeClass = 'badge-info';

  if (['healthy', 'completed'].includes(normalized)) {
    badgeClass = 'badge-healthy';
  } else if (['early-degradation', 'in-progress', 'dispatched', 'medium'].includes(normalized)) {
    badgeClass = 'badge-early-degradation';
  } else if (['severe-anomaly', 'critical-shutdown', 'critical', 'urgent', 'high'].includes(normalized)) {
    badgeClass = 'badge-severe-anomaly';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      {status}
    </span>
  );
};
