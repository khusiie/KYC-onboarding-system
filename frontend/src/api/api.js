import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1/';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export const login = async (username, password) => {
  // Explicitly set headers to ensure JSON format
  const response = await api.post('auth/token/', 
    { username, password },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return response.data;
};

export const register = async (username, email, password) => {
  const response = await api.post('auth/register/', { username, email, password });
  return response.data;
};

export const getMyKYC = () => api.get('kyc/me/');
export const updateMyKYC = (data) => api.patch('kyc/me/', data);
export const submitKYC = () => api.post('kyc/me/submit/');
export const getNotifications = () => api.get('kyc/notifications/');
export const uploadDoc = (formData) => api.post('kyc/documents/', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

export const getQueue = (status = 'submitted') => api.get(`reviewer/queue/?status=${status}`);
export const getSubmissionDetail = (id) => api.get(`reviewer/submission/${id}/`);
export const takeAction = (id, data) => api.post(`reviewer/submission/${id}/action/`, data);
export const getMetrics = () => api.get('reviewer/metrics/');

export default api;
