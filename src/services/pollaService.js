// frontend/src/services/pollaService.js
import api from './api';

const BASE = '/polla';

const pollaService = {
  // ── Públicos ────────────────────────────────────────────────────────────

  listPollas: () => api.get(`${BASE}/`).then(r => r.data),

  getPolla: (pollaId) => api.get(`${BASE}/${pollaId}`).then(r => r.data),

  getPollaMatches: (pollaId, phase = null) => {
    const params = phase ? { phase } : {};
    return api.get(`${BASE}/${pollaId}/matches`, { params }).then(r => r.data);
  },

  // ── Autenticados ────────────────────────────────────────────────────────

  joinPolla: (pollaId) =>
    api.post(`${BASE}/${pollaId}/join`).then(r => r.data),

  getMyStatus: (pollaId) =>
    api.get(`${BASE}/${pollaId}/me`).then(r => r.data),

  getMyPredictions: (pollaId, phase = null) => {
    const params = phase ? { phase } : {};
    return api.get(`${BASE}/${pollaId}/my-predictions`, { params }).then(r => r.data);
  },

  getNextMatches: (pollaId, limit = 10) =>
    api.get(`${BASE}/${pollaId}/next-matches`, { params: { limit } }).then(r => r.data),

  submitPrediction: (pollaId, data) =>
    api.post(`${BASE}/${pollaId}/predict`, data).then(r => r.data),

  // ── Admin ───────────────────────────────────────────────────────────────

  adminCreatePolla: (data) =>
    api.post(`${BASE}/admin/create`, data).then(r => r.data),

  adminUpdatePolla: (pollaId, data) =>
    api.put(`${BASE}/admin/${pollaId}`, data).then(r => r.data),

  adminAddMatch: (pollaId, data) =>
    api.post(`${BASE}/admin/${pollaId}/add-match`, data).then(r => r.data),

  adminRemoveMatch: (pollaId, pmId) =>
    api.delete(`${BASE}/admin/${pollaId}/match/${pmId}`).then(r => r.data),

  adminScoreMatch: (pollaId, pmId, data) =>
    api.post(`${BASE}/admin/${pollaId}/score-match/${pmId}`, data).then(r => r.data),

  adminUpdateRankings: (pollaId) =>
    api.post(`${BASE}/admin/${pollaId}/update-rankings`).then(r => r.data),

  adminListParticipants: (pollaId) =>
    api.get(`${BASE}/admin/${pollaId}/participants`).then(r => r.data),
};

export default pollaService;
