// frontend/src/services/competitionService.js
import { competitionsAPI, teamsAPI, matchesAPI, roundsAPI } from './api';
import matchService from './matchService';
import api from './api'; // Importar api base

class CompetitionService {
  constructor() {
    this.teamCache = new Map();
    this.teamRequestCache = new Map();
  }
  // ============================================
  // SECCIÓN DE COMPETENCIAS
  // ============================================
  async getCompetitionTeams(competitionId) {
    try {
      const response = await competitionsAPI.getCompetitionTeams(competitionId);
      return response;
    } catch (error) {
      console.error(`Error fetching teams for competition ${competitionId}:`, error);
      throw error;
    }
  }
  
  async getCompetitions(params = {}) {
    try {
      const response = await competitionsAPI.getAll(params);
      
      const mappedCompetitions = response.data.map(comp => ({
        ...comp,
        status: this.mapCompetitionStatus(comp.status),
        total_teams: comp.total_teams || 0,
      }));
      
      return {
        ...response,
        data: mappedCompetitions
      };
    } catch (error) {
      console.error('Error fetching competitions:', error);
      throw error;
    }
  }

  mapCompetitionStatus(backendStatus) {
    if (!backendStatus) return backendStatus;
    const normalized = String(backendStatus).trim().toLowerCase();
    const statusMap = {
      'draft': 'Programado',
      'borrador': 'En curso',
      'active': 'En curso',
      'en curso': 'En curso',
      'en_curso': 'En curso',
      'completed': 'Finalizado',
      'finalizado': 'Finalizado',
      'cancelled': 'Cancelado',
      'cancelado': 'Cancelado',
      'scheduled': 'Programado',
      'programado': 'Programado'
    };
    
    return statusMap[normalized] || backendStatus;
  }

  async getCompetition(id) {
    return competitionsAPI.getById(id);
  }

  async createCompetition(data) {
    return competitionsAPI.create(data);
  }

  async updateCompetition(id, data) {
    return competitionsAPI.update(id, data);
  }

  async deleteCompetition(id) {
    return competitionsAPI.delete(id);
  }

  async getStats(id) {
    try {
      const response = await competitionsAPI.getStats(id);
      return response;
    } catch (error) {
      console.error('Error getting competition stats:', error);
      return {
        data: {
          total_matches: 0,
          matches_played: 0,
          matches_scheduled: 0,
          matches_in_progress: 0,
          goals_scored: 0,
          avg_goals_per_match: 0,
          total_rounds: 0,
          completed_rounds: 0
        }
      };
    }
  }

  async addTeamsToCompetition(id, teamIds) {
    const data = { team_ids: teamIds };
    
    try {
      const response = await competitionsAPI.addTeams(id, data);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async removeTeamFromCompetition(competitionId, teamId) {
    try {
      const response = await competitionsAPI.removeTeam(competitionId, teamId);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async generateSchedule(id) {
    return competitionsAPI.generateSchedule(id);
  }

  async getCompetitionTemplates(templateName, totalTeams) {
    return competitionsAPI.getTemplates(templateName, totalTeams);
  }

  async uploadCompetitionLogo(competitionId, file) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/competitions/${competitionId}/upload-logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async getAllCompetitions() {
    try {
      const response = await competitionsAPI.getAll({ limit: 100 });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching all competitions:', error);
      return [];
    }
  }

  // ============================================
  // SECCIÓN DE EQUIPOS
  // ============================================
  async getCompetitionTeams(competitionId) {
    try {
      const response = await teamsAPI.getByCompetition(competitionId);
      return response;
    } catch (error) {
      console.error(`Error fetching teams for competition ${competitionId}:`, error);
      
      // Fallback: intentar usar competitionsAPI si teamsAPI no funciona
      try {
        const fallbackResponse = await competitionsAPI.getById(competitionId);
        if (fallbackResponse.data && fallbackResponse.data.teams) {
          return { data: fallbackResponse.data.teams };
        }
      } catch (fallbackError) {
        console.error('Fallback también falló:', fallbackError);
      }
      
      // Si todo falla, devolver array vacío
      return { data: [] };
    }
  }

  async getTeams(params = {}) {
    return teamsAPI.getAll(params);
  }

  async getTeam(teamId) {
    if (!teamId) return { data: null };

    if (this.teamCache.has(teamId)) {
      return { data: this.teamCache.get(teamId) };
    }

    if (this.teamRequestCache.has(teamId)) {
      return this.teamRequestCache.get(teamId);
    }

    const request = (async () => {
      try {
        const response = await teamsAPI.getById(teamId);
        this.teamCache.set(teamId, response.data);
        return response;
      } catch (error) {
        console.error(`Error fetching team ${teamId}:`, error);
        throw error;
      } finally {
        this.teamRequestCache.delete(teamId);
      }
    })();

    this.teamRequestCache.set(teamId, request);
    return request;
  }

  async getTeamsByIds(teamIds) {
    if (!teamIds || teamIds.length === 0) return [];
    
    try {
      const responses = await Promise.all(teamIds.map((teamId) => this.getTeam(teamId)));
      return responses.map((res) => res.data).filter(Boolean);
    } catch (error) {
      console.error('Error fetching teams by IDs:', error);
      return [];
    }
  }

  async createTeam(data) {
    return teamsAPI.create(data);
  }

  async updateTeam(id, data) {
    const response = await teamsAPI.update(id, data);
    if (response?.data) {
      this.teamCache.set(id, response.data);
    } else {
      this.teamCache.delete(id);
    }
    return response;
  }

  async deleteTeam(id) {
    return teamsAPI.delete(id);
  }

  async searchTeams(query) {
    return teamsAPI.search(query);
  }

  // ============================================
  // SECCIÓN DE PARTIDOS
  // ============================================
  async getMatches(params = {}) {
    try {
      console.log('📞 Llamando a getMatches con params:', params);
      const response = await matchService.getAll(params);
      
      console.log('✅ Backend respondió con:', response.data?.length || 0, 'partidos');
      
      if (response.data && response.data.length > 0) {
        console.log('📋 Primer partido del backend:', {
          id: response.data[0].id,
          round_id: response.data[0].round_id,
          home_team: response.data[0].home_team_name,
          away_team: response.data[0].away_team_name
        });
      }
      
      const processedMatches = (response.data || []).map(match => ({
        ...match,
        home_score: Number(match.home_score) || 0,
        away_score: Number(match.away_score) || 0,
        status: this.normalizeMatchStatus(match.status),
        home_team_name: match.home_team_name || `Equipo ${match.home_team_id}`,
        away_team_name: match.away_team_name || `Equipo ${match.away_team_id}`,
        round_name: match.round_name || (match.round_id ? `Jornada ${match.round_id}` : 'Sin jornada'),
        round_number: match.round_number || match.round_id,
        round_is_completed: match.round_is_completed || false,
        competition_name: match.competition_name || 'Sin competencia'
      }));
      
      return {
        ...response,
        data: processedMatches
      };
    } catch (error) {
      console.error('❌ Error en getMatches:', error);
      return {
        data: [],
        total: 0
      };
    }
  }

  async getMatch(id) {
    try {
      console.log(`📞 Llamando a getMatch con ID: ${id}`);
      const response = await matchService.getById(id);
      
      if (response.data) {
        response.data = {
          ...response.data,
          home_score: Number(response.data.home_score) || 0,
          away_score: Number(response.data.away_score) || 0,
          status: this.normalizeMatchStatus(response.data.status),
          round_name: response.data.round?.name || `Jornada ${response.data.round_id || ''}`
        };
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Error fetching match ${id}:`, error);
      throw error;
    }
  }

  async createMatch(data) {
    try {
      const matchData = {
        ...data,
        home_score: data.home_score || 0,
        away_score: data.away_score || 0,
        status: data.status || 'PROGRAMADO'
      };
      
      console.log('📤 Enviando datos de partido:', matchData);
      const response = await matchService.create(matchData);
      return response;
    } catch (error) {
      console.error('❌ Error creating match:', error);
      throw error;
    }
  }

  async updateMatch(id, data) {
    try {
      console.log('📤 Actualizando partido:', { id, data });
      const response = await matchService.update(id, data);
      return response;
    } catch (error) {
      console.error(`❌ Error updating match ${id}:`, error);
      throw error;
    }
  }

  async deleteMatch(id) {
    try {
      const response = await matchService.delete(id);
      return response;
    } catch (error) {
      console.error(`Error deleting match ${id}:`, error);
      throw error;
    }
  }

  async getTodayMatches() {
    try {
      const response = await matchService.getTodayMatches();
      
      if (response.data) {
        if (response.data.today) {
          response.data.today = response.data.today.map(match => ({
            ...match,
            status: this.normalizeMatchStatus(match.status)
          }));
        }
        if (response.data.upcoming) {
          response.data.upcoming = response.data.upcoming.map(match => ({
            ...match,
            status: this.normalizeMatchStatus(match.status)
          }));
        }
      }
      
      return response;
    } catch (error) {
      console.error('Error fetching today matches:', error);
      return {
        data: {
          today: [],
          upcoming: [],
          date: new Date().toISOString()
        }
      };
    }
  }

  async getMatchesByCompetition(competitionId, params = {}) {
    try {
      const response = await matchService.getByCompetition(competitionId, params);
      
      if (response.data && response.data.matches) {
        response.data.matches = response.data.matches.map(match => ({
          ...match,
          status: this.normalizeMatchStatus(match.status)
        }));
      }
      
      return response;
    } catch (error) {
      console.error(`Error fetching matches for competition ${competitionId}:`, error);
      return {
        data: {
          competition_id: competitionId,
          matches: [],
          stats: {
            total_matches: 0,
            finished_matches: 0,
            scheduled_matches: 0,
            total_goals: 0,
            avg_goals_per_match: 0
          }
        }
      };
    }
  }

  async getMatchesByCompetitionAndRound(competitionId, roundNumber) {
      try {
        const response = await matchService.getByCompetitionAndRound(competitionId, roundNumber); 
        if (response.data && response.data.matches) {
          response.data.matches = response.data.matches.map(match => ({
            ...match,
            status: this.normalizeMatchStatus(match.status)
          }));
        }
        return response;
      } catch (error) {
        console.error(`Error fetching matches for competition ${competitionId} and round ${roundNumber}:`, error);
        return {  
          data: {
            competition_id: competitionId,
            round_number: roundNumber,
            matches: [],
              

            total_matches: 0,
            finished_matches: 0,
            is_completed: false
          }
        };
      }
  }

  async getMatchesByRound(roundId) {
    try {
      const response = await matchService.getByRound(roundId);
      
      if (response.data && response.data.matches) {
        response.data.matches = response.data.matches.map(match => ({
          ...match,
          status: this.normalizeMatchStatus(match.status)
        }));
      }
      
      return response;
    } catch (error) {
      console.error(`Error fetching matches for round ${roundId}:`, error);
      return {
        data: {
          round_id: roundId,
          matches: [],
          total_matches: 0,
          finished_matches: 0,
          is_completed: false
        }
      };
    }
  }

  async getMatchesWithRounds(params = {}) {
    try {
      const response = await matchesAPI.getAll(params);
      return response;
    } catch (error) {
      console.error('Error fetching matches with rounds:', error);
      throw error;
    }
  }

  normalizeMatchStatus(status, reverse = false) {
    if (!status) return 'Programado';
    
    const toSpanish = {
      'PROGRAMADO': 'Programado',
      'Programado': 'Programado',
      'scheduled': 'Programado',
      'EN_CURSO': 'En curso',
      'En curso': 'En curso',
      'en_curso': 'En curso',
      'in_progress': 'En curso',
      'FINALIZADO': 'Finalizado',
      'Finalizado': 'Finalizado',
      'finished': 'Finalizado',
      'APLAZADO': 'Aplazado',
      'Aplazado': 'Aplazado',
      'postponed': 'Aplazado',
      'CANCELADO': 'Cancelado',
      'Cancelado': 'Cancelado',
      'cancelled': 'Cancelado'
    };
    
    const toBackend = {
      'programado': 'PROGRAMADO',
      'en curso': 'EN_CURSO',
      'finalizado': 'FINALIZADO',
      'aplazado': 'APLAZADO',
      'cancelado': 'CANCELADO'
    };
    
    const normalized = String(status).trim();
    
    if (reverse) {
      const lower = normalized.toLowerCase();
      return toBackend[lower] || normalized.toUpperCase();
    } else {
      return toSpanish[normalized] || normalized;
    }
  }

  async getAvailableTeamsForCompetition(competitionId) {
    try {
      console.log(`📞 Obteniendo equipos para competencia ${competitionId}`);
      const response = await matchService.getAvailableTeams(competitionId);
      
      console.log(`✅ Equipos obtenidos: ${response.data?.teams?.length || 0}`);
      
      return response;
    } catch (error) {
      console.error(`Error obteniendo equipos para competencia ${competitionId}:`, error);
      return this.getTeams({ limit: 50 });
    }
  }

  // ============================================
  // SECCIÓN DE JORNADAS
  // ============================================
  async getRounds(competitionId, params = {}) {
    try {
      const response = await competitionsAPI.getRounds(competitionId, params);
      return response;
    } catch (error) {
      console.error(`Error fetching rounds for competition ${competitionId}:`, error);
      throw error;
    }
  }

  // FUNCIÓN PRINCIPAL - USAR SIEMPRE ESTA
  async getRound(competitionId, roundId) {
    try {
      console.log(`📞 Obteniendo jornada ${roundId} de competencia ${competitionId}`);
      
      // LLAMAR AL ENDPOINT CORRECTO
      const response = await api.get(`/competitions/${competitionId}/rounds/${roundId}`);
      
      if (response.data) {
        console.log(`✅ Jornada obtenida: ${response.data.name}`);
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Error obteniendo jornada ${roundId}:`, error);
      throw error;
    }
  }

  async getRoundById(competitionId, roundId) {
    try {
      const response = await competitionsAPI.getRound(competitionId, roundId);
      return response;
    } catch (error) {
      console.error(`Error fetching round ${roundId}:`, error);
      throw error;
    }
  }

  async getRoundByNumber(competitionId, roundNumber) {
    try {
      const response = await competitionsAPI.getRound(competitionId, roundNumber);
      return response;
    } catch (error) {
      console.error(`Error fetching round number ${roundNumber}:`, error);
      throw error;
    }
  }

  async createRound(competitionId, data) {
    return roundsAPI.create(competitionId, data);
  }

  async updateRound(competitionId, roundId, data) {
    return roundsAPI.update(competitionId, roundId, data);
  }

  async deleteRound(competitionId, roundId) {
    return roundsAPI.delete(competitionId, roundId);
  }

  async completeRound(competitionId, roundId) {
    return roundsAPI.completeRound(competitionId, roundId);
  }

  async getRoundsByCompetition(competitionId) {
    try {
      const response = await roundsAPI.getByCompetition(competitionId, { limit: 50 });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching rounds:', error);
      return [];
    }
  }

  // ============================================
  // SECCIÓN DE STANDINGS (TABLA DE POSICIONES)
  // ============================================
  async getStandings(competitionId) {
    try {
      const response = await competitionsAPI.getStandings(competitionId);
      return response;
    } catch (error) {
      console.error(`Error fetching standings for competition ${competitionId}:`, error);
      throw error;
    }
  }

  async getStandingsGroups(competitionId) {
    try {
      const response = await competitionsAPI.getStandingsGroups(competitionId);
      return response;
    } catch (error) {
      console.error(`Error fetching standings groups for competition ${competitionId}:`, error);
      throw error;
    }
  }

  async getPlayoffBracket(competitionId) {
    try {
      const response = await competitionsAPI.getPlayoffBracket(competitionId, { params: { allow_incomplete: true } });
      return response;
    } catch (error) {
      console.error(`Error fetching playoff bracket for competition ${competitionId}:`, error);
      throw error;
    }
  }

  async getStandingsWithRecentForm(competitionId, params = {}) {
    try {
      const response = await api.get(`/competitions/${competitionId}/standings/with-recent-form`, { params });
      return response;
    } catch (error) {
      console.error(`Error fetching standings with recent form for competition ${competitionId}:`, error);
      throw error;
    }
  }

  async getStandingsHistory(competitionId) {
    try {
      const response = await competitionsAPI.getStandingsHistory(competitionId);
      return response;
    } catch (error) {
      console.error(`Error fetching standings history for competition ${competitionId}:`, error);
      throw error;
    }
  }
  
  async enrichStandingsWithTeamData(standings) {
    if (!Array.isArray(standings) || standings.length === 0) return [];
    
    if (standings[0].team_name) {
      return standings;
    }
    
    console.log('🔄 Enriqueciendo datos de equipos...');
    
    try {
      const teamIds = [...new Set(standings.map(item => item.team_id))];
      
      const teamPromises = teamIds.map(teamId => 
        this.getTeam(teamId).catch(() => null)
      );
      
      const teamsResponses = await Promise.all(teamPromises);
      
      const teamsMap = {};
      teamsResponses.forEach(response => {
        if (response && response.data) {
          teamsMap[response.data.id] = response.data;
        }
      });
      
      return standings.map((standing, index) => {
        const team = teamsMap[standing.team_id];
        return {
          id: standing.id || index,
          position: standing.position || index + 1,
          team_id: standing.team_id,
          team_name: team?.name || `Equipo ${standing.team_id}`,
          team_logo: team?.logo_url || null,
          team_short_name: team?.short_name || '',
          matches_played: standing.matches_played || standing.games_played || 0,
          matches_won: standing.matches_won || standing.wins || 0,
          matches_drawn: standing.matches_drawn || standing.draws || 0,
          matches_lost: standing.matches_lost || standing.losses || 0,
          goals_for: standing.goals_for || 0,
          goals_against: standing.goals_against || 0,
          goal_difference: standing.goal_difference || 
                          (standing.goals_for || 0) - (standing.goals_against || 0),
          points: standing.points || 
                 ((standing.wins || 0) * 3) + (standing.draws || 0),
          recent_form: standing.recent_form || []
        };
      });
      
    } catch (error) {
      console.error('❌ Error enriqueciendo datos:', error);
      return standings.map((standing, index) => ({
        id: standing.id || index,
        position: standing.position || index + 1,
        team_id: standing.team_id,
        team_name: `Equipo ${standing.team_id}`,
        team_logo: null,
        matches_played: standing.matches_played || 0,
        matches_won: standing.wins || 0,
        matches_drawn: standing.draws || 0,
        matches_lost: standing.losses || 0,
        goals_for: standing.goals_for || 0,
        goals_against: standing.goals_against || 0,
        goal_difference: standing.goal_difference || 0,
        points: standing.points || 0,
        recent_form: standing.recent_form || []
      }));
    }
  }

  calculateTeamRecentForm(matches, teamId, limit = 5) {
    if (!Array.isArray(matches)) return [];
    
    try {
      const teamMatches = matches.filter(match => 
        match.home_team_id === teamId || match.away_team_id === teamId
      );
      
      const recentMatches = teamMatches
        .sort((a, b) => new Date(b.match_date) - new Date(a.match_date))
        .slice(0, limit);
      
      return recentMatches.map(match => {
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
    } catch (error) {
      console.error(`Error calculando forma para equipo ${teamId}:`, error);
      return [];
    }
 
  }
  async getStandingsWithForm(competitionId, params = {}) {
    try {
      const response = await competitionsAPI.get(`${competitionId}/standings/with-recent-form`, { params });
      return response;
    } catch (error) {
      console.error(`Error fetching standings with form for competition ${competitionId}:`, error);
      throw error;
    }
  }

  // ============================================
  // FUNCIONES AUXILIARES
  // ============================================
  formatMatchDate(dateString, format = 'full') {
    if (!dateString) return 'Fecha no definida';
    
    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      
      const formats = {
        'short': date.toLocaleDateString('es-ES', { 
          day: '2-digit', 
          month: '2-digit',
          year: 'numeric' 
        }),
        'medium': date.toLocaleDateString('es-ES', { 
          weekday: 'short',
          day: '2-digit', 
          month: 'short',
          year: 'numeric' 
        }),
        'full': date.toLocaleDateString('es-ES', { 
          weekday: 'long',
          day: 'numeric', 
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        'time': date.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        'date': date.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      };
      
      return formats[format] || formats['full'];
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  }

  validateMatchData(matchData) {
    const errors = [];
    
    if (!matchData.home_team_id) {
      errors.push('Se requiere equipo local');
    }
    
    if (!matchData.away_team_id) {
      errors.push('Se requiere equipo visitante');
    }
    
    if (matchData.home_team_id && matchData.away_team_id && 
        matchData.home_team_id === matchData.away_team_id) {
      errors.push('Los equipos no pueden ser el mismo');
    }
    
    if (!matchData.match_date) {
      errors.push('Se requiere fecha del partido');
    } else {
      const matchDate = new Date(matchData.match_date);
      if (isNaN(matchDate.getTime())) {
        errors.push('Fecha inválida');
      } else if (matchDate < new Date() && matchData.status === 'scheduled') {
        errors.push('La fecha del partido programado no puede ser en el pasado');
      }
    }
    
    if (!matchData.competition_id) {
      errors.push('Se requiere competencia');
    }
    
    if (matchData.status === 'finished') {
      if (matchData.home_score === undefined || matchData.home_score === null) {
        errors.push('Se requiere marcador local para partido finalizado');
      }
      if (matchData.away_score === undefined || matchData.away_score === null) {
        errors.push('Se requiere marcador visitante para partido finalizado');
      }
      
      if (matchData.home_score < 0 || matchData.away_score < 0) {
        errors.push('Los marcadores no pueden ser negativos');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}

export default new CompetitionService(); 
