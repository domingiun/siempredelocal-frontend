// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

// M5: Mensaje de error sanitizado — no expone detalles internos del backend
const extractSafeError = (err, defaultMsg) => {
  if (!err.response) return 'Error de conexión. Verifica tu red.';

  const status = err.response?.status;
  if (status >= 500) return 'Error del servidor. Intenta más tarde.';

  const detail = err.response?.data?.detail;
  // Solo mostramos el campo "detail" string — nunca objetos completos o stacks
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((e) => e.msg || e.detail).join(', ');

  return defaultMsg;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // C5: Ya no leemos el token de localStorage.
    // Intentamos /auth/me — si la cookie httpOnly es válida, el backend la valida.
    const loadUser = async () => {
      try {
        const userResponse = await authAPI.getProfile();
        setUser(userResponse.data);
      } catch {
        // Cookie ausente o expirada — el usuario no está autenticado
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (username, password) => {
    try {
      setError(null);
      const loginRes = await authAPI.login(username, password);

      // iOS Safari bloquea cookies SameSite=None con ITP.
      // Guardamos el token en sessionStorage como fallback para Bearer auth.
      // La cookie httpOnly sigue siendo la vía principal en Chrome/Firefox.
      const token = loginRes.data?.access_token;
      if (token) sessionStorage.setItem('_t', token);

      const userResponse = await authAPI.getProfile();
      setUser(userResponse.data);
      return { success: true, data: userResponse.data };
    } catch (err) {
      const errorMsg = extractSafeError(err, 'Error en el inicio de sesión');
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      await authAPI.register(userData);
      return await login(userData.username, userData.password);
    } catch (err) {
      const errorMsg = extractSafeError(err, 'Error en el registro');
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout(); // El backend borra la cookie httpOnly
    } catch {
      // Si falla, igual limpiamos el estado local
    } finally {
      sessionStorage.removeItem('_t'); // Limpiar token iOS
      setUser(null);
      setError(null);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getProfile();
      setUser(response.data);
      return response.data;
    } catch {
      return null;
    }
  };

  const updateUser = (userData) => {
    if (!userData) return;
    // C5: Ya no guardamos en localStorage — solo estado React en memoria
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        refreshUser,
        updateUser,
        setError,
        isAdmin: user?.role?.toLowerCase() === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
