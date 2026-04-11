// frontend/src/services/betService.js
import api from './api';

class BetService {
  // ============================================
  // FECHAS DE APUESTAS 
  // ============================================
  
  async getBetDates(params = {}) {
    try {
      console.log('📅 Obteniendo fechas de los pronósticos...');
      const response = await api.get('/betdates/', { params });
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo fechas:', error);
      throw error;
    }
  }

  async getBetDateDetails(betDateId) {
    try {
      const response = await api.get(`/bet-integration/betdate/${betDateId}`);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo detalle de fecha:', error);
      throw error;
    }
  }

  async getBetDateDetailsAdmin(betDateId) {
    try {
      const response = await api.get(`/betdates/${betDateId}`);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo detalle de fecha (admin):', error);
      throw error;
    }
  }
  
  async createBetDate(data) {
    try {
      console.log('📝 Creando nueva fecha...');
      const response = await api.post('/betdates/', data);
      return response;
    } catch (error) {
      console.error('❌ Error creando fecha:', error);
      throw error;
    }
  }

  async updateBetDate(betDateId, data) {
    try {
      console.log(`???? Actualizando fecha ${betDateId}...`);
      const response = await api.put(`/betdates/${betDateId}`, data);
      return response;
    } catch (error) {
      console.error(`??? Error actualizando fecha ${betDateId}:`, error);
      throw error;
    }
  }
    
  async getAvailableMatches(competitionId = null) {
    try {
      console.log('⚽ Obteniendo partidos disponibles...');
      const params = competitionId ? { competition_id: competitionId } : {};
      const response = await api.get('/bet-integration/available-matches', { params });
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo partidos:', error);
      throw error;
    }
  }
    
  // ============================================
  // APUESTAS Y PREDICCIONES
  // ============================================
  
  async placeBet(userId, betDateId, predictions) { 
    try {
      console.log('🎯 Enviando apuesta...');
      const data = {
        bet_date_id: betDateId,
        predictions: predictions
      };
      const response = await api.post(`/bet-integration/place-bet?user_id=${userId}`, data);
      return response;
    } catch (error) {
      console.error('❌ Error enviando apuesta:', error);
      throw error;
    }
  }
  
  async validateBet(userId, betDateId, predictions) { 
    try {
      console.log('✅ Validando apuesta...');
      const data = {
        user_id: userId, 
        bet_date_id: betDateId,
        predictions: predictions
      };
      const response = await api.post('/bet-integration/validate-bet', data);
      return response;
    } catch (error) {
      console.error('❌ Error validando apuesta:', error);
      throw error;
    }
  }
  
  async getUserBets(userId, params = {}) {
    try {
      console.log(`👤 Obteniendo pronósticos de usuario ${userId}...`);
      const response = await api.get(`/bets/user/${userId}`, { params });
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo pronósticos:', error);
      throw error;
    }
  }
  
  async getBetById(betId) {
    try {
      console.log(`🔍 Obteniendo apuesta ${betId}...`);
      const response = await api.get(`/prediction/bets/${betId}`);
      return response;
    } catch (error) {
      console.error(`❌ Error obteniendo apuesta ${betId}:`, error);
      throw error;
    }
  }

  async getBetPredictions(betId) {
    try {
      console.log(`Obteniendo predicciones apuesta ${betId}...`);
      const response = await api.get(`/predictions/bet/${betId}`);
      return response;
    } catch (error) {
      console.error(`Error obteniendo predicciones apuesta ${betId}:`, error);
      throw error;
    }
  }
  
  // ============================================
  // RANKING Y RESULTADOS
  // ============================================
  
  async getRanking(betDateId, options = {}) {
    try {
      console.log(`🏆 Obteniendo ranking fecha ${betDateId}...`);
      const response = await api.get(`/bet-integration/ranking/${betDateId}`);
      return response;
    } catch (error) {
      const status = error?.response?.status;
      if (!(options.silent404 && (status === 400 || status === 404))) {
        console.error(`❌ Error obteniendo ranking ${betDateId}:`, error);
      }
      throw error;
    }
  }
  
  async getRankingPreview(betDateId) {
    try {
      console.log(`👀 Obteniendo preview ranking ${betDateId}...`);
      const response = await api.get(`/bet-integration/ranking-preview/${betDateId}`);
      return response;
    } catch (error) {
      console.error(`❌ Error obteniendo preview ranking:`, error);
      throw error;
    }
  }
  
  async getRankingDetailed(betDateId) {
    try {
      console.log(`📊 Obteniendo ranking detallado ${betDateId}...`);
      // ❌ Este endpoint NO existe: "/bet-integration/ranking-detailed/{id}"
      // En su lugar, usa el ranking normal o quita esta función
      throw new Error('Endpoint no implementado');
      // const response = await api.get(`/bet-integration/ranking-detailed/${betDateId}`);
      // return response;
    } catch (error) {
      console.error(`❌ Error obteniendo ranking detallado:`, error);
      throw error;
    }
  }
  
  async finalizeBetDate(betDateId) {
    try {
      console.log(`🎬 Finalizando fecha ${betDateId}...`);
      const response = await api.post(`/bet-integration/finalize/${betDateId}`);
      return response;
    } catch (error) {
      console.error(`❌ Error finalizando fecha:`, error);
      throw error;
    }
  }
  
  async closeBetDate(betDateId) {
    try {
      console.log(`🔒 Cerrando fecha ${betDateId}...`);
      const response = await api.post(`/bet-integration/close/${betDateId}`);
      return response;
    } catch (error) {
      console.error(`❌ Error cerrando fecha:`, error);
      throw error;
    }
  }
  
  async getBetDateSummary(betDateId) {
    try {
      console.log(`📋 Obteniendo resumen fecha ${betDateId}...`);
      const response = await api.get(`/bet-integration/summary/${betDateId}`);
      return response;
    } catch (error) {
      console.error(`❌ Error obteniendo resumen:`, error);
      throw error;
    }
  }
  
  // ============================================
  // TRANSACCIONES Y BILLETERA
  // ============================================
  
  async purchaseCredits(userId, planId, paymentMethod = 'nequi', paymentReference = null) {
  try {
    // Validar que solo se use 'nequi' o 'admin'
    if (!['nequi', 'admin'].includes(paymentMethod)) {
      paymentMethod = 'nequi'; // fallback seguro
    }

    console.log(`💰 Comprando créditos plan ${planId} con ${paymentMethod}...`);

    const data = {
      plan_id: planId,
      payment_method: paymentMethod,
      payment_reference: paymentReference
    };

    const response = await api.post(
      `/transactions/purchase-credits?user_id=${userId}`,
      data
    );

    return response;

  } catch (error) {
    console.error('❌ Error recargando créditos:', error);
    throw error;
  }
}

  
  async convertToCash(userId, creditsToConvert, conversionRate = 4500) {
    try {
      console.log(`💸 Convirtiendo ${creditsToConvert} créditos a Puntos...`);
      const data = {
        credits_to_convert: creditsToConvert,
        conversion_rate: conversionRate
      };
      const response = await api.post(`/transactions/convert-to-cash?user_id=${userId}`, data);
      return response;
    } catch (error) {
      console.error('❌ Error convirtiendo a Puntos:', error);
      throw error;
    }
  }

  async requestPointsToCredits(userId, pointsToConvert, creditValue = 5000) {
    try {
      const data = {
        points_to_convert: pointsToConvert,
        credit_value_pts: creditValue
      };
      const response = await api.post(`/transactions/request/points-to-credits?user_id=${userId}`, data);
      return response;
    } catch (error) {
      console.error('❌ Error solicitando canje de puntos:', error);
      throw error;
    }
  }

  async requestWithdrawPoints(userId, amountPts, paymentMethod = 'nequi') {
    try {
      const data = {
        amount_pts: amountPts,
        payment_method: paymentMethod
      };
      const response = await api.post(`/transactions/request/withdraw?user_id=${userId}`, data);
      return response;
    } catch (error) {
      console.error('❌ Error solicitando retiro:', error);
      throw error;
    }
  }
  
  async getTransactionHistory(userId, params = {}) {
    try {
      console.log(`📜 Obteniendo historial transacciones ${userId}...`);
      // Intentar el endpoint principal
      const response = await api.get(`/transactions/history/${userId}`, { params });
      return response;
    } catch (error) {
      console.log('⚠️ Intentando endpoint alternativo...');
      try {
        // Intentar endpoint temporal
        const response = await api.get(`/bet-integration/transactions/history/${userId}`, { params });
        return response;
      } catch (fallbackError) {
        console.error('❌ Error obteniendo historial:', fallbackError);
        throw fallbackError;
      }
    }
  }
  
  async getWalletBalance(userId) {
    try {
      console.log(`💰 Obteniendo saldo wallet ${userId}...`);
      const response = await api.get(`/wallets/${userId}`);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo saldo:', error);
      throw error;
    }
  }
  
  // ============================================
  // PLANES Y PRECIOS
  // ============================================
  
  async getBetPlans() {
    try {
      console.log('📋 Obteniendo planes de créditos...');
      const response = await api.get('/transactions/plans');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo planes:', error);
      throw error;
    }
  }
  
  async getCreditInfo() {
    try {
      console.log('💵 Obteniendo información de créditos...');
      // Intentar el endpoint principal
      const response = await api.get('/pricing/credit-info');
      return response;
    } catch (error) {
      console.log('⚠️ Intentando endpoint alternativo...');
      try {
        // Intentar endpoint temporal en integration
        const response = await api.get('/bet-integration/pricing/credit-info');
        return response;
      } catch (fallbackError) {
        console.error('⚠️ No se pudo obtener info de pricing, usando valores por defecto');
        return {
          data: {
            credit_price_PTS: 5000,
            prize_contribution_per_credit: 1950,
            profit_per_credit: 3050,
            required_credits_per_bet: 1,
            min_points_to_win: 13,
            max_predictions_per_bet: 10
          }
        };
      }
    }
  }
  
  async getPricingConfiguration() {
    try {
      console.log('⚙️ Obteniendo configuración de precios...');
      const response = await api.get('/pricing/configuration');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo configuración:', error);
      throw error;
    }
  }
  
  async comparePlans() {
    try {
      console.log('⚖️ Comparando planes...');
      const response = await api.get('/pricing/plans/compare');
      return response;
    } catch (error) {
      console.error('❌ Error comparando planes:', error);
      throw error;
    }
  }
  
  async calculateProfit(predictions) {
    try {
      console.log('🧮 Calculando ganancias potenciales...');
      const data = {
        num_bets: predictions.length,  // ✅ Corrección: usa num_bets según el schema
        include_taxes: true,
        tax_percentage: 19
      };
      const response = await api.post('/pricing/calculate-profit', data);
      return response;
    } catch (error) {
      console.error('❌ Error calculando ganancias:', error);
      throw error;
    }
  }
  
  async getFinancialSummary(days = 30) {
    try {
      console.log('📈 Obteniendo resumen financiero...');
      const response = await api.get(`/pricing/financial-summary?days=${days}`);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo resumen financiero:', error);
      throw error;
    }
  }
  
  async getUserStatus(userId) {
    try {
      console.log(`👤 Obteniendo estado usuario ${userId}...`);
      const response = await api.get(`/bet-integration/user-status/${userId}`);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo estado usuario:', error);
      throw error;
    }
  }
  
  async getBetStats() {
    try {
      console.log('📊 Obteniendo estadísticas...');
      const response = await api.get('/bet-integration/stats');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw error;
    }
  }
}

export default new BetService();
