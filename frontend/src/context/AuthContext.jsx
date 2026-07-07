import React, { createContext, useState, useContext, useEffect } from 'react';
import { adminApi } from '../api/axiosConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || null);
  const [adminId, setAdminId] = useState(localStorage.getItem('adminId') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [loading, setLoading] = useState(false);

  const login = async (password) => {
    setLoading(true);
    try {
      const response = await adminApi.post('/login', { password });
      const { access_token, admin_id } = response.data;
      
      localStorage.setItem('adminToken', access_token);
      localStorage.setItem('adminId', admin_id);
      
      setToken(access_token);
      setAdminId(admin_id);
      setIsAuthenticated(true);
      
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed';
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminId');
    setToken(null);
    setAdminId(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    if (token) {
      setIsAuthenticated(true);
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, adminId, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};