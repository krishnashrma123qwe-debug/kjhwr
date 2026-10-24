/**
 * API Service for UK Wind Procurement Portal
 * Communicates with FastAPI backend with support for custom base URL and local dev proxy.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error ${res.status}: ${res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    console.error(`API Error on ${url}:`, err);
    throw err;
  }
}

export const api = {
  getHealth: () => request('/health'),
  
  getSummary: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/summary?${query}`);
  },

  getTimeseries: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/timeseries?${query}`);
  },

  getDaily: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/daily?${query}`);
  },

  getDiurnal: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/diurnal?${query}`);
  },

  getErrorDistribution: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/error-distribution?${query}`);
  },

  simulateProcurement: (body) => {
    return request('/simulate-procurement', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
};
