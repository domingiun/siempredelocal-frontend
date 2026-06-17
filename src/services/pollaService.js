// frontend/src/services/pollaService.js
import api from './api';

const BASE = '/polla';

// ── Cache simple con TTL ────────────────────────────────────────────────────
const _cache = {};
const TTL = 30_000; // 30 segundos

function fromCache(key, fetcher) {
  const hit = _cache[key];
  if (hit && Date.now() - hit.ts < TTL) return Promise.resolve(hit.data);
  return fetcher().then(data => { _cache[key] = { data, ts: Date.now() }; return data; });
}

function bust(...keys) { keys.forEach(k => delete _cache[k]); }

// ── Servicio ────────────────────────────────────────────────────────────────
const pollaService = {
  // ── Públicos ────────────────────────────────────────────────────────────

  listPollas: () =>
    fromCache('listPollas', () => api.get(`${BASE}/`).then(r => r.data)),

  adminListAllPollas: () => api.get(`${BASE}/admin/all`).then(r => r.data),

  getPolla: (pollaId) =>
    fromCache(`polla_${pollaId}`, () => api.get(`${BASE}/${pollaId}`).then(r => r.data)),

  getPollaMatches: (pollaId, phase = null) => {
    const key = phase ? `matches_${pollaId}_${phase}` : `matches_${pollaId}`;
    return fromCache(key, () => {
      const params = phase ? { phase } : {};
      return api.get(`${BASE}/${pollaId}/matches`, { params }).then(r => r.data);
    });
  },

  // ── Autenticados ────────────────────────────────────────────────────────

  joinPolla: (pollaId) =>
    api.post(`${BASE}/${pollaId}/join`).then(r => {
      bust('listPollas', `polla_${pollaId}`, `status_${pollaId}`);
      return r.data;
    }),

  getMyStatus: (pollaId) =>
    fromCache(`status_${pollaId}`, () => api.get(`${BASE}/${pollaId}/me`).then(r => r.data)),

  getMyPredictions: (pollaId, phase = null) => {
    const params = phase ? { phase } : {};
    return api.get(`${BASE}/${pollaId}/my-predictions`, { params }).then(r => r.data);
  },

  getNextMatches: (pollaId, limit = 10) =>
    api.get(`${BASE}/${pollaId}/next-matches`, { params: { limit } }).then(r => r.data),

  submitPrediction: (pollaId, data) =>
    api.post(`${BASE}/${pollaId}/predict`, data).then(r => {
      bust(`status_${pollaId}`);
      return r.data;
    }),

  // ── Admin ───────────────────────────────────────────────────────────────

  adminCreatePolla: (data) =>
    api.post(`${BASE}/admin/create`, data).then(r => { bust('listPollas'); return r.data; }),

  adminUpdatePolla: (pollaId, data) =>
    api.put(`${BASE}/admin/${pollaId}`, data).then(r => {
      bust('listPollas', `polla_${pollaId}`);
      return r.data;
    }),

  adminAddMatch: (pollaId, data) =>
    api.post(`${BASE}/admin/${pollaId}/add-match`, data).then(r => {
      bust(`matches_${pollaId}`);
      return r.data;
    }),

  adminRemoveMatch: (pollaId, pmId) =>
    api.delete(`${BASE}/admin/${pollaId}/match/${pmId}`).then(r => {
      bust(`matches_${pollaId}`);
      return r.data;
    }),

  adminScoreMatch: (pollaId, pmId, data) =>
    api.post(`${BASE}/admin/${pollaId}/score-match/${pmId}`, data).then(r => {
      bust(`polla_${pollaId}`, `status_${pollaId}`, `matches_${pollaId}`);
      return r.data;
    }),

  adminUpdateRankings: (pollaId) =>
    api.post(`${BASE}/admin/${pollaId}/update-rankings`).then(r => {
      bust(`polla_${pollaId}`);
      return r.data;
    }),

  adminListParticipants: (pollaId) =>
    api.get(`${BASE}/admin/${pollaId}/participants`).then(r => r.data),

  adminResetCloseAt: (pollaId, hours = 2) =>
    api.post(`${BASE}/admin/${pollaId}/reset-close-at?hours=${hours}`).then(r => r.data),

  getParticipantPredictions: (pollaId, userId) =>
    api.get(`${BASE}/${pollaId}/participant/${userId}/predictions`).then(r => r.data),

  adminRescoreMatch: (pollaId, pmId, data = {}) =>
    api.post(`${BASE}/admin/${pollaId}/rescore-match/${pmId}`, data).then(r => {
      bust(`polla_${pollaId}`, `status_${pollaId}`, `matches_${pollaId}`);
      return r.data;
    }),

  adminRescoreFinished: (pollaId) =>
    api.post(`${BASE}/admin/${pollaId}/rescore-finished`).then(r => {
      bust(`polla_${pollaId}`, `matches_${pollaId}`);
      return r.data;
    }),

  adminFinalizePolla: (pollaId) =>
    api.post(`${BASE}/admin/${pollaId}/finalize`).then(r => {
      bust('listPollas', `polla_${pollaId}`);
      return r.data;
    }),

  purchasePollaEntry: (pollaId) =>
    api.post(`${BASE}/${pollaId}/purchase-entry`).then(r => r.data),
};

export default pollaService;
