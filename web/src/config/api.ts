import axios from 'axios';

const API_URL = import.meta.env.PROD
  ? 'https://love-library-a28m.onrender.com/api'  // Production (Render)
  : 'http://localhost:5000/api';  // Local development

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    // Explicitly remove Authorization header if no token
    delete config.headers.Authorization;
  }
  // Don't set Content-Type for FormData - let browser set it with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      error.message = 'Cannot connect to server. Please check your internet connection or try again later.';
    }
    return Promise.reject(error);
  }
);

export default api;


