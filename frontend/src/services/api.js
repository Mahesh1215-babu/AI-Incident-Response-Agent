import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configure dynamic authorization interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agent_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const authAPI = {
  login: async (email, password) => {
    const res = await api.post('/login', { email, password });
    return res.data;
  },
  signup: async (email, password, role = 'engineer') => {
    const res = await api.post('/signup', { email, password, role });
    return res.data;
  },
  logout: async () => {
    const res = await api.post('/logout');
    return res.data;
  }
};

export const incidentsAPI = {
  uploadLog: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/upload-log', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  analyze: async (title, logs, severity, environment, contains_pii = false) => {
    const res = await api.post('/analyze', { title, logs, severity, environment, contains_pii });
    return res.data;
  },
  getIncidents: async (params = {}) => {
    const res = await api.get('/incidents', { params });
    return res.data;
  },
  getIncident: async (id) => {
    const res = await api.get(`/incident/${id}`);
    return res.data;
  },
  deleteIncident: async (id) => {
    const res = await api.delete(`/incident/${id}`);
    return res.data;
  },
  submitFeedback: async (feedbackData) => {
    const res = await api.post('/feedback', feedbackData);
    return res.data;
  }
};

export const memoryAPI = {
  search: async (q = '', filterType = 'All') => {
    const res = await api.get('/memory/search', {
      params: { q, filter_type: filterType }
    });
    return res.data;
  },
  reflect: async (query) => {
    const res = await api.get('/memory/reflect', {
      params: { query }
    });
    return res.data;
  }
};

export const reportsAPI = {
  getReports: async () => {
    const res = await api.get('/reports');
    return res.data;
  },
  getAdminAnalytics: async () => {
    const res = await api.get('/admin/analytics');
    return res.data;
  },
  getMemoryDelta: async (id1, id2) => {
    const res = await api.get('/reports/memory-delta', {
      params: { id1, id2 }
    });
    return res.data;
  },
  testWebhook: async (payload) => {
    const res = await api.post('/integrations/webhook-test', payload);
    return res.data;
  }
};

export default api;
