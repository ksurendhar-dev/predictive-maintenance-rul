const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const BASE_URL = `${API_BASE}/api`;

export const api = {
  getOverview: async () => {
    const res = await fetch(`${BASE_URL}/overview`);
    return res.json();
  },
  getMachines: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/machines${query ? '?' + query : ''}`);
    return res.json();
  },
  getMachine: async (id) => {
    const res = await fetch(`${BASE_URL}/machines/${id}`);
    return res.json();
  },
  getRul: async () => {
    const res = await fetch(`${BASE_URL}/rul`);
    return res.json();
  },
  getAlerts: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/alerts${query ? '?' + query : ''}`);
    return res.json();
  },
  acknowledgeAlert: async (id) => {
    const res = await fetch(`${BASE_URL}/alerts/${id}/acknowledge`, {
      method: 'PATCH'
    });
    return res.json();
  },
  resolveAlert: async (id) => {
    const res = await fetch(`${BASE_URL}/alerts/${id}/resolve`, {
      method: 'PATCH'
    });
    return res.json();
  },
  createAlert: async (data) => {
    const res = await fetch(`${BASE_URL}/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  getWorkOrders: async () => {
    const res = await fetch(`${BASE_URL}/work-orders`);
    return res.json();
  },
  createWorkOrder: async (data) => {
    const res = await fetch(`${BASE_URL}/work-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  updateWorkOrder: async (id, update) => {
    const res = await fetch(`${BASE_URL}/work-orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update)
    });
    return res.json();
  },
  completeWorkOrder: async (id) => {
    const res = await fetch(`${BASE_URL}/work-orders/${id}/complete`, {
      method: 'PATCH'
    });
    return res.json();
  },
  getTelemetry: async (machineId) => {
    const res = await fetch(`${BASE_URL}/telemetry/${machineId}`);
    return res.json();
  },
  triggerScenario: async (scenario) => {
    const res = await fetch(`${BASE_URL}/simulator/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario })
    });
    return res.json();
  }
};
