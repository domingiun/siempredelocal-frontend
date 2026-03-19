// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        try {
          const userResponse = await authAPI.getProfile();
          setUser(userResponse.data);
        } catch (err) {
          console.log('Token inválido, limpiando almacenamiento');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };
    
    loadUser();
  }, []);

  const login = async (username, password) => {
    try {
      setError(null);
      const response = await authAPI.login(username, password);
      
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        
        const userResponse = await authAPI.getProfile();
        const userData = userResponse.data;
        
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return { success: true, data: userData };
      }
      
      return { success: false, error: 'No se recibió token' };
    } catch (err) {
      let errorMsg = 'Error en el inicio de sesión';
      
      if (err.response?.data) {
        if (err.response.data.detail) {
          errorMsg = err.response.data.detail;
        } else if (Array.isArray(err.response.data)) {
          errorMsg = err.response.data.map(e => e.msg || e.detail).join(', ');
        } else if (typeof err.response.data === 'object') {
          errorMsg = JSON.stringify(err.response.data);
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await authAPI.register(userData);
      
      return await login(userData.username, userData.password);
    } catch (err) {
      let errorMsg = 'Error en el registro';
      
      if (err.response?.data) {
        if (err.response.data.detail) {
          errorMsg = err.response.data.detail;
        } else if (Array.isArray(err.response.data)) {
          errorMsg = err.response.data.map(e => e.msg || e.detail).join(', ');
        } else if (typeof err.response.data === 'object') {
          errorMsg = JSON.stringify(err.response.data);
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setError(null);
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getProfile();
      const userData = response.data;
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (err) {
      console.error('Error refrescando usuario:', err);
      return null;
    }
  };

  const updateUser = (userData) => {
    if (!userData) return;
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      login, 
      register, 
      logout,
      refreshUser,
      updateUser,
      setError,
      isAdmin: user?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
};
