// frontend/src/services/teamService.js
import api from './api';

const teamService = {
  // Obtener todos los equipos
  getAll: (params = {}) => {
    return api.get('/teams/', { params });
  },
  
  // Obtener equipo por ID
  getById: (id) => {
    return api.get(`/teams/${id}`);
  },
  
  // Crear equipo
  create: (teamData) => {
    return api.post('/teams/', teamData);
  },
  
  // Actualizar equipo
  update: (id, teamData) => {
    return api.put(`/teams/${id}`, teamData);
  },
  
  // Eliminar equipo
  delete: (id) => {
    return api.delete(`/teams/${id}`);
  },
  
  // Obtener últimos partidos de un equipo específico
  getRecentMatches: async (teamId, limit = 5) => {
    try {
      // Obtener todos los partidos finalizados
      const response = await api.get('/matches/', {
        params: {
          status: 'Finalizado',  // Cambia según tu API
          limit: 30  // Traer suficientes para filtrar
        }
      });
      
      // Filtrar solo partidos donde participa este equipo
      const teamMatches = (response.data || []).filter(match => 
        match.home_team_id === teamId || match.away_team_id === teamId
      );
      
      // Ordenar por fecha más reciente y limitar
      const recent = teamMatches
        .sort((a, b) => new Date(b.match_date) - new Date(a.match_date))
        .slice(0, limit);
      
      // Transformar para obtener resultados (W/D/L)
      const form = recent.map(match => {
        const isHome = match.home_team_id === teamId;
        
        if (isHome) {
          if (match.home_score > match.away_score) return 'W';
          if (match.home_score < match.away_score) return 'L';
          return 'D';
        } else {
          if (match.away_score > match.home_score) return 'W';
          if (match.away_score < match.home_score) return 'L';
          return 'D';
        }
      });
      
      return {
        matches: recent,
        form: form
      };
      
    } catch (error) {
      console.error('Error getting team recent matches:', error);
      return { matches: [], form: [] };
    }
  },
  
  // Método específico para obtener solo la forma (W/D/L)
  getRecentForm: async (teamId, limit = 5) => {
    try {
      const recentData = await teamService.getRecentMatches(teamId, limit);
      return recentData.form;
    } catch (error) {
      console.error('Error getting team form:', error);
      return [];
    }
  },
  
  // Método combinado para obtener equipos con su forma reciente
  getTeamsWithForm: async (competitionId = null, formLimit = 5) => {
    try {
      // Obtener equipos
      const params = competitionId ? { competition_id: competitionId } : {};
      const teamsResponse = await api.get('/teams/', { params });
      const teams = teamsResponse.data || [];
      
      // Para cada equipo, obtener su forma reciente
      const teamsWithForm = await Promise.all(
        teams.map(async (team) => {
          const form = await teamService.getRecentForm(team.id, formLimit);
          return {
            ...team,
            recent_form: form
          };
        })
      );
      
      return teamsWithForm;
    } catch (error) {
      console.error('Error getting teams with form:', error);
      return [];
    }
  }
};

export default teamService;
