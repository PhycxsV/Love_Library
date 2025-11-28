import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../config/api';

interface User {
  id: string;
  email: string;
  username: string;
  profilePhoto?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth().catch(console.error);
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        // Verify the token is still valid and matches the stored user
        try {
          const response = await api.get('/auth/me');
          const currentUser = response.data.user;
          const parsedStoredUser = JSON.parse(storedUser);
          
          // Verify the token belongs to the stored user
          if (currentUser.id === parsedStoredUser.id && currentUser.email === parsedStoredUser.email) {
            // Token is valid and matches stored user
            setToken(storedToken);
            setUser(currentUser); // Use the fresh user data from the server
            localStorage.setItem('user', JSON.stringify(currentUser)); // Update stored user data
          } else {
            // Token belongs to a different user - clear everything
            console.warn('Token mismatch detected. Clearing auth data.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          // Token is invalid or expired - clear it
          console.warn('Token validation failed. Clearing auth data.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      // Clear potentially corrupted data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      setToken(token);
      setUser(user);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error 
        || error.message 
        || 'Login failed. Please check your connection and try again.';
      throw new Error(errorMessage);
    }
  };

  const register = async (email: string, username: string, password: string) => {
    try {
      const response = await api.post('/auth/register', { email, username, password });
      const { user, token } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      setToken(token);
      setUser(user);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error 
        || error.message 
        || 'Registration failed. Please check your connection and try again.';
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};


