// frontend/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para responses - SIN message.error
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Solo manejar redirección 401
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirigir sin mostrar mensaje aquí
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// API de Autenticación
export const authAPI = {
  login: (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    return api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  },
  
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (payload) => api.post('/auth/forgot-password', payload),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
};

// API de Competencias
export const competitionsAPI = {
  getAll: (params) => api.get('/competitions/', { params }),
  getById: (id) => api.get(`/competitions/${id}`),
  create: (data) => api.post('/competitions/', data),
  update: (id, data) => api.put(`/competitions/${id}`, data),
  delete: (id) => api.delete(`/competitions/${id}`),
  getStats: (id) => api.get(`/competitions/${id}/stats`),
  addTeams: (id, data) => { 
    const response = api.post(`/competitions/${id}/teams`, data);
    return response;
  },
  removeTeam: (competitionId, teamId) => api.delete(`/competitions/${competitionId}/teams/${teamId}`),
  generateSchedule: (id) => api.post(`/competitions/${id}/generate-schedule`),
  getTemplates: (templateName, totalTeams) => 
    api.get(`/competitions/templates/${templateName}?total_teams=${totalTeams}`),
  getStandings: (competitionId) => api.get(`/competitions/${competitionId}/standings`),
  getStandingsGroups: (competitionId) => api.get(`/competitions/${competitionId}/standings/groups`),
  getStandingsHistory: (competitionId) => api.get(`/competitions/${competitionId}/standings/history`),
  getPlayoffBracket: (competitionId, config = {}) => api.get(`/competitions/${competitionId}/standings/playoff-bracket`, config),
  getRounds: (competitionId, params = {}) => api.get(`/competitions/${competitionId}/rounds/`, { params }),
  getRound: (competitionId, roundId) => api.get(`/competitions/${competitionId}/rounds/${roundId}`),
};

// API de Equipos
export const teamsAPI = {
  getAll: (params) => api.get('/teams/', { params }),
  getById: (id) => api.get(`/teams/${id}`),
  create: (data) => api.post('/teams/', data),
  update: (id, data) => api.put(`/teams/${id}`, data),
  delete: (id) => api.delete(`/teams/${id}`),
  search: (query) => api.get('/teams/', { params: { search: query } }),
  getByCompetition: (competitionId) => 
      api.get(`/competitions/${competitionId}/teams`),
  getStats: (teamId) => api.get(`/teams/${teamId}/stats`),
  getUpcomingMatches: (teamId) => api.get(`/teams/${teamId}/matches/upcoming`),
};

// API de Partidos
export const matchesAPI = {
  // Debe incluir todas estas funciones
  getAll: (params) => api.get('/matches/', { params }),
  getById: (id) => api.get(`/matches/${id}`),
  create: (data) => api.post('/matches/', data),
  update: (id, data) => api.put(`/matches/${id}`, data),
  delete: (id) => api.delete(`/matches/${id}`),
  getTodayMatches: () => api.get('/matches/today/upcoming'),
  getByCompetition: (competitionId, params) => 
    api.get(`/matches/competition/${competitionId}`, { params }),
  getByRound: (roundId) => api.get(`/matches/round/${roundId}`),
};

// frontend/src/services/api.js (o donde tengas roundsAPI)

// API de Jornadas
export const roundsAPI = {
  // Obtener jornadas de una competencia
  getByCompetition: (competitionId, params) => 
    api.get(`/competitions/${competitionId}/rounds`, { params }),
  
  // Obtener jornada por ID (global)
  getById: (competitionId, roundId) => 
    api.get(`/competitions/${competitionId}/rounds/${roundId}`),
  
  // Obtener jornada por número (dentro de la competencia) - NUEVO
  getByNumber: (competitionId, roundNumber) => 
    api.get(`/competitions/${competitionId}/rounds/number/${roundNumber}`),
  
  // Crear jornada
  create: (competitionId, data) => 
    api.post(`/competitions/${competitionId}/rounds`, data),
  
  // Actualizar jornada
  update: (competitionId, roundId, data) => 
    api.put(`/competitions/${competitionId}/rounds/${roundId}`, data),
  
  // Eliminar jornada
  delete: (competitionId, roundId) =>
    api.delete(`/competitions/${competitionId}/rounds/${roundId}`),
  
  // Completar jornada
  completeRound: (competitionId, roundId) =>
    api.post(`/competitions/${competitionId}/rounds/${roundId}/complete`),
  
  // Validar jornada
  validateRound: (competitionId, roundId) =>
    api.get(`/competitions/${competitionId}/rounds/${roundId}/validate`),
  
  // Auto-actualizar estado de jornada
  autoUpdateStatus: (competitionId, roundId) =>
    api.post(`/competitions/${competitionId}/rounds/${roundId}/auto-update`),
  
  // Obtener resumen de jornadas
  getSummary: (competitionId) =>
    api.get(`/competitions/${competitionId}/rounds/summary`),
  
  // Método inteligente que decide cuál usar
  getRound: (competitionId, identifier) => {
    // Si identifier es un número pequeño (probablemente round_number)
    if (typeof identifier === 'number' && identifier < 100) {
      return api.get(`/competitions/${competitionId}/rounds/number/${identifier}`);
    }
    // Si es un número grande (probablemente round_id)
    else if (typeof identifier === 'number' && identifier >= 100) {
      return api.get(`/competitions/${competitionId}/rounds/${identifier}`);
    }
    // Si es un string, intentar parsear
    else if (typeof identifier === 'string') {
      const num = parseInt(identifier);
      if (!isNaN(num)) {
        // Decidir basado en el número
        if (num < 100) {
          return api.get(`/competitions/${competitionId}/rounds/number/${num}`);
        } else {
          return api.get(`/competitions/${competitionId}/rounds/${num}`);
        }
      }
    }
    // Por defecto, tratar como ID
    return api.get(`/competitions/${competitionId}/rounds/${identifier}`);
  }
};

export default api;
