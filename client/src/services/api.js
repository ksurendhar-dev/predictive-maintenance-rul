const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const BASE_URL = `${API_BASE}/api`;

const authHeaders = () => {
  const token = localStorage.getItem('predictive_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  login: async (credentials) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return res.json();
  },
  getDemoUsers: async () => {
    const res = await fetch(`${BASE_URL}/auth/demo-users`);
    return res.json();
  },
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
      method: 'PATCH',
      headers: { ...authHeaders() }
    });
    return res.json();
  },
  resolveAlert: async (id) => {
    const res = await fetch(`${BASE_URL}/alerts/${id}/resolve`, {
      method: 'PATCH',
      headers: { ...authHeaders() }
    });
    return res.json();
  },
  createAlert: async (data) => {
    const res = await fetch(`${BASE_URL}/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
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
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  updateWorkOrder: async (id, update) => {
    const res = await fetch(`${BASE_URL}/work-orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(update)
    });
    return res.json();
  },
  completeWorkOrder: async (id) => {
    const res = await fetch(`${BASE_URL}/work-orders/${id}/complete`, {
      method: 'PATCH',
      headers: { ...authHeaders() }
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
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ scenario })
    });
    return res.json();
  }
};
