import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🚀 DEPLOYED BACKEND (Recommended for APK):
// Your backend is deployed at: https://love-library-a28m.onrender.com
//
// 📱 LOCAL DEVELOPMENT (For testing on same WiFi):
// 1. Get your IP: cd backend && npm run get-ip
// 2. Replace URL with: 'http://YOUR_IP:5000/api' (e.g., 'http://192.168.1.100:5000/api')
// 3. Make sure backend is running: cd backend && npm run dev
// 4. Phone must be on same WiFi network

const API_URL = __DEV__ 
  ? 'https://love-library-a28m.onrender.com/api'  // Your deployed Render backend
  : 'https://love-library-a28m.onrender.com/api';  // Same URL for production

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    // Explicitly remove Authorization header if no token
    delete config.headers.Authorization;
  }
  return config;
});

export default api;





