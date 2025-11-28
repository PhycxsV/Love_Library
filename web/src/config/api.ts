import axios from 'axios';

// Always use Render backend for deployed app
// For local dev, you can temporarily change this to 'http://localhost:5000/api'
const API_URL = 'https://love-library-a28m.onrender.com/api';

// Debug logging
console.log('🌐 API URL:', API_URL);
console.log('🔍 Environment Mode:', import.meta.env.MODE);
console.log('🔍 Is Production:', import.meta.env.PROD);

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


