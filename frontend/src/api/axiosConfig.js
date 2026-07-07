import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Admin API
export const adminApi = axios.create({
  baseURL: `${API_URL}/api/admin`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to every request
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 (expired token)
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminId');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// Participant API (no auth)
export const participantApi = axios.create({
  baseURL: `${API_URL}/api/participant`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default adminApi;