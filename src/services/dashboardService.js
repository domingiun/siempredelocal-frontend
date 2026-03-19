// frontend/src/services/dashboardService.js
import api from './api';

const dashboardService = {
  getSummary: () => api.get('/dashboard/summary'),
  getQuickStats: () => api.get('/dashboard/quick-stats'),
  getRecentActivity: () => api.get('/dashboard/recent-activity'),
  getCalendar: (params) => api.get('/dashboard/calendar', { params }),
  getCompetitionStats: (competitionId) => api.get(`/competitions/${competitionId}/stats/overview`),
  getTeamStats: (teamId) => api.get(`/teams/${teamId}/stats/overall`),
};

export default dashboardService;
