// frontend/src/services/matchService.js
import api from './api';

const matchService = {
  // Obtener todos los partidos
  getAll: async (params = {}) => {
    try {
      return await api.get('/matches/', { params });
    } catch (error) {
      console.error('Error en matchService.getAll:', error);
      return { data: [] };
    }
  },
  
  // Obtener un partido por ID
  getById: (id) => {
    return api.get(`/matches/${id}`);
  },
  
  // Crear un partido
  create: (matchData) => {
    return api.post('/matches/', matchData);
  },
  
  // Actualizar un partido
  update: (id, matchData) => {
    return api.put(`/matches/${id}`, matchData);
  },
  
  // Eliminar un partido
  delete: (id) => {
    return api.delete(`/matches/${id}`);
  },
  
  // Actualizar solo el marcador
  updateScore: (id, homeScore, awayScore) => {
    return api.put(`/matches/${id}`, {
      home_score: homeScore,
      away_score: awayScore,
      status: 'finished'
    });
  },
  
  // Obtener partidos de hoy
   getTodayMatches: async () => {
    try {
      return await api.get('/matches/today/upcoming');
    } catch (error) {
      console.error('Error en matchService.getTodayMatches:', error);
      return { data: { today: [], upcoming: [] } }; // Retorna estructura vacía
    }
  },
  
  // Obtener partidos por competencia
  getByCompetition: (competitionId, params = {}) => {
    return api.get(`/matches/competition/${competitionId}`, { params });
  },
  
  // Obtener partidos por jornada
  getByRound: (roundId) => {
    return api.get(`/matches/round/${roundId}`);
  },
 
  getAvailableTeams: (competitionId) => {
    return api.get(`/matches/competition/${competitionId}/available-teams`);
  }
};

export default matchService;
