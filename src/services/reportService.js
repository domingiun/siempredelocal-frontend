import api from './api';

const reportService = {
  async getPerformanceSummary(days = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - Number(days || 30));
    const toDate = (d) => d.toISOString().slice(0, 10);

    const [
      integrationStatsRes,
      financialKpisRes,
      transactionsDashboardRes,
      betDatesRes,
      financialRangeRes,
      pendingHistoryRes,
      completedHistoryRes,
    ] = await Promise.allSettled([
      api.get('/bet-integration/stats'),
      api.get(`/pricing/financial-summary?days=${days}`),
      api.get('/transactions/admin/dashboard'),
      api.get('/betdates/'),
      api.get('/financial/summary/range', {
        params: { start_date: toDate(startDate), end_date: toDate(endDate) },
      }),
      api.get('/transactions/admin/history', {
        params: { status: 'pending', limit: 1, offset: 0 },
      }),
      api.get('/transactions/admin/history', {
        params: { status: 'completed', limit: 1, offset: 0 },
      }),
    ]);

    const integrationStats =
      integrationStatsRes.status === 'fulfilled' ? integrationStatsRes.value.data : {};
    const financialKpis =
      financialKpisRes.status === 'fulfilled' ? financialKpisRes.value.data : {};
    const transactionsDashboard =
      transactionsDashboardRes.status === 'fulfilled' ? transactionsDashboardRes.value.data : {};
    const betDates = betDatesRes.status === 'fulfilled' ? (betDatesRes.value.data || []) : [];
    const financialRange =
      financialRangeRes.status === 'fulfilled'
        ? financialRangeRes.value.data
        : {
            total_revenue_cop: financialKpis?.total_revenue_cop || 0,
            total_prize_pool_cop: 0,
            total_app_pool_cop: financialKpis?.total_profit_cop || 0,
          };
    const pendingHistory =
      pendingHistoryRes.status === 'fulfilled' ? pendingHistoryRes.value.data : { total: 0 };
    const completedHistory =
      completedHistoryRes.status === 'fulfilled' ? completedHistoryRes.value.data : { total: 0 };

    const normalizeMatchStatus = (status) => String(status || '').toLowerCase().trim();
    const isMatchFinished = (status) => {
      const normalized = normalizeMatchStatus(status);
      return normalized === 'finished' || normalized.includes('finalizado');
    };
    const deriveBetDateStatus = (betDate) => {
      const matches = betDate.matches || [];
      if (matches.length === 0) return betDate.status || 'open';

      const now = new Date();
      const allFinished = matches.every((m) => isMatchFinished(m.status));
      if (allFinished) return 'finished';

      const hasPastMatch = matches.some((m) => {
        if (!m.match_date) return false;
        const matchDate = new Date(m.match_date);
        return matchDate < now;
      });

      if (hasPastMatch) return 'closed';
      return betDate.status || 'open';
    };

    const betDatesWithDetails = await Promise.all(
      betDates.map(async (date) => {
        try {
          const detail = await api.get(`/bet-integration/betdate/${date.id}`);
          return {
            ...date,
            matches: detail?.data?.matches || [],
          };
        } catch (_error) {
          return date;
        }
      })
    );

    const withUiStatus = betDatesWithDetails.map((d) => ({
      ...d,
      uiStatus: deriveBetDateStatus(d),
    }));

    const closedDatesFromList = withUiStatus.filter((d) => d.uiStatus === 'closed').length;
    const finishedDatesFromList = withUiStatus.filter((d) => d.uiStatus === 'finished').length;
    const activeDatesFromList = withUiStatus.filter((d) => d.uiStatus === 'open').length;

    const operation = {
      totalBetDates: withUiStatus.length,
      activeDates: activeDatesFromList,
      finishedDates: finishedDatesFromList,
      closedDates: closedDatesFromList,
    };
    operation.processedDates = operation.closedDates + operation.finishedDates;

    return {
      integration: integrationStats,
      financial: financialKpis,
      financialRange,
      transactions: transactionsDashboard,
      historyStatus: {
        pending: pendingHistory?.total || 0,
        completed: completedHistory?.total || 0,
      },
      operation,
    };
  },

  async getAttendanceSummary(days = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - Number(days || 30));
    const toDate = (d) => d.toISOString().slice(0, 10);

    const [usersCreditsRes, financialKpis, integrationStats, financialRangeRes, txDashboardRes] = await Promise.allSettled([
      api.get('/financial/users-credits-summary', {
        params: { start_date: toDate(startDate), end_date: toDate(endDate) },
      }),
      api.get(`/pricing/financial-summary?days=${days}`),
      api.get('/bet-integration/stats'),
      api.get('/financial/summary/range', {
        params: { start_date: toDate(startDate), end_date: toDate(endDate) },
      }),
      api.get('/transactions/admin/dashboard'),
    ]);

    return {
      usersCredits:
        usersCreditsRes.status === 'fulfilled'
          ? (usersCreditsRes.value.data?.users || [])
          : [],
      lastBetdateName:
        usersCreditsRes.status === 'fulfilled'
          ? (usersCreditsRes.value.data?.last_betdate_name || null)
          : null,
      financial: financialKpis.status === 'fulfilled' ? financialKpis.value.data : {},
      integration: integrationStats.status === 'fulfilled' ? integrationStats.value.data : {},
      financialRange:
        financialRangeRes.status === 'fulfilled'
          ? financialRangeRes.value.data
          : { total_credits_used: 0 },
      transactions: txDashboardRes.status === 'fulfilled' ? txDashboardRes.value.data : {},
    };
  },

  async getFinancialGeneralSummary() {
    const response = await api.get('/financial/summary/general');
    return response.data;
  },

  async getFinancialSummaryByRange(startDate, endDate) {
    const response = await api.get('/financial/summary/range', {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  async getFinancialTransactionStatus() {
    const [dashboardRes, pendingRes, completedRes] = await Promise.allSettled([
      api.get('/transactions/admin/dashboard'),
      api.get('/transactions/admin/history', {
        params: { status: 'pending', limit: 1, offset: 0 },
      }),
      api.get('/transactions/admin/history', {
        params: { status: 'completed', limit: 1, offset: 0 },
      }),
    ]);

    return {
      dashboard: dashboardRes.status === 'fulfilled' ? dashboardRes.value.data : {},
      pending: pendingRes.status === 'fulfilled' ? pendingRes.value.data?.total || 0 : 0,
      completed: completedRes.status === 'fulfilled' ? completedRes.value.data?.total || 0 : 0,
    };
  },

  async resetAccumulatedPrize(betDateId) {
    const response = await api.post(`/financial/accumulated-prize/reset/${betDateId}`);
    return response.data;
  },

  async getBetDates() {
    const response = await api.get('/betdates/');
    return response.data || [];
  },
};

export default reportService;
