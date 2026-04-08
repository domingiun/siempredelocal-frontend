// frontend/src/utils/betCalculations.js
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/es';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('es');

const hasTimeZoneInfo = (value) => {
  if (typeof value !== 'string') return false;
  return /Z$/.test(value) || /[+-]\d{2}:\d{2}$/.test(value);
};

// ============================================
// FUNCIONES DE FECHA Y HORA
// ============================================

// Formato para tarjetas y listas
export const formatDateTimeShort = (date) => {
  if (!date) return 'Fecha no disponible';
  
  try {
    if (typeof date === 'string') {
      // Si tiene Z u offset, es UTC
      if (hasTimeZoneInfo(date)) {
        return dayjs.utc(date).local().format('DD/MM/YYYY hh:mm A');
      }
      // Si no tiene zona horaria, tratar como hora local
      return dayjs(date).format('DD/MM/YYYY hh:mm A');
    }
    
    // Si ya es un objeto Date o Dayjs
    return dayjs(date).format('DD/MM/YYYY hh:mm A');
  } catch (error) {
    console.error('Error formateando fecha corta:', error);
    return 'Fecha invÃ¡lida';
  }
};

// Formato completo
export const formatDateTime = (date) => {
  if (!date) return 'Fecha no disponible';
  
  try {
    if (typeof date === 'string') {
      if (hasTimeZoneInfo(date)) {
        return dayjs.utc(date).local().format('dddd, DD [de] MMMM [de] YYYY HH:mm');
      }
      return dayjs(date).format('dddd, DD [de] MMMM [de] YYYY HH:mm');
    }
    return dayjs(date).format('dddd, DD [de] MMMM [de] YYYY HH:mm');
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return 'Fecha invÃ¡lida';
  }
};

// Formato solo fecha (sin hora)
export const formatDateOnly = (date) => {
  if (!date) return '';
  
  try {
    if (typeof date === 'string') {
      return dayjs.utc(date).local().format('DD/MM/YYYY');
    }
    return dayjs(date).format('DD/MM/YYYY');
  } catch (error) {
    return dayjs(date).isValid() ? dayjs(date).format('DD/MM/YYYY') : '';
  }
};

// Formato solo hora
export const formatTimeOnly = (date) => {
  if (!date) return '';
  
  try {
    if (typeof date === 'string') {
      return dayjs.utc(date).local().format('HH:mm');
    }
    return dayjs(date).format('HH:mm');
  } catch (error) {
    return dayjs(date).isValid() ? dayjs(date).format('HH:mm') : '';
  }
};

// Formato para inputs de fecha
export const formatForInput = (date) => {
  if (!date) return null;
  
  try {
    if (typeof date === 'string') {
      return dayjs.utc(date).local();
    }
    return dayjs(date);
  } catch (error) {
    return null;
  }
};

// ============================================
// FUNCIONES DE APUESTAS
// ============================================

// Calcular tiempo restante para apostar
export const calculateTimeRemaining = (betDate) => {
  if (!betDate) return 'Agotado';
  
  try {
    const now = dayjs();
    const matches = betDate.matches || [];
    const firstMatchDate = matches
      .map(m => m.match_date)
      .filter(Boolean)
      .map(d => (typeof d === 'string' ? dayjs.utc(d).local() : dayjs(d)))
      .sort((a, b) => a.valueOf() - b.valueOf())[0];
    
    if (!firstMatchDate || !firstMatchDate.isValid()) return 'Agotado';
    
    const diffMinutes = firstMatchDate.diff(now, 'minute');
    
    // Agotado una hora antes del inicio
    if (diffMinutes <= 60) return 'Agotado';
    
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
    
    return `${Math.floor(diffMinutes / 1440)} días`;
  } catch (error) {
    console.error('Error calculando tiempo restante:', error);
    return 'Error';
  }
};

// Verificar si fecha estÃ¡ abierta
export const isBetDateOpen = (betDate) => {
  if (!betDate) return false;
  
  try {
    const now = dayjs();
    const closing = dayjs(betDate.closing_time);
    
    return (
      betDate.status === 'open' && 
      now.isBefore(closing) &&
      betDate.matches?.length === 10
    );
  } catch (error) {
    console.error('Error verificando fecha:', error);
    return false;
  }
};

// Validar predicciones antes de enviar
export const validatePredictions = (predictions) => {
  const errors = [];
  
  // Debe tener 10 predicciones
  if (!predictions || predictions.length !== 10) {
    errors.push('Debes predecir los 10 partidos');
    return errors;
  }
  
  // Cada prediccion debe tener marcador
  predictions.forEach((pred, index) => {
    if (pred.home_score == null || pred.away_score == null) {
      errors.push(`Partido ${index + 1}: Falta marcador`);
    } else if (pred.home_score < 0 || pred.away_score < 0) {
      errors.push(`Partido ${index + 1}: Marcador no puede ser negativo`);
    } else if (pred.home_score > 20 || pred.away_score > 20) {
      errors.push(`Partido ${index + 1}: Marcador mÃ¡ximo 20 goles`);
    }
  });
  
  return errors;
};

// Formatear premio
export const formatPrize = (amount) => {
  if (!amount) return '0';

  const formatted = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0
  }).format(amount);

  return `${formatted}`;
};

// Calcular puntos por prediccion
export const calculatePredictionPoints = (prediction, matchResult) => {
  if (!prediction || !matchResult) return 0;
  
  const { home_score: predHome, away_score: predAway } = prediction;
  const { home_score: resultHome, away_score: resultAway } = matchResult;
  
  // Marcador exacto
  if (predHome === resultHome && predAway === resultAway) {
    return 3;
  }
  
  // Ganador correcto
  const predWinner = predHome > predAway ? 'home' : predHome < predAway ? 'away' : 'draw';
  const resultWinner = resultHome > resultAway ? 'home' : resultHome < resultAway ? 'away' : 'draw';
  
  if (predWinner === resultWinner) {
    return 1;
  }
  
  return 0;
};

// Calcular total de puntos
export const calculateTotalPoints = (predictions, matchResults) => {
  if (!predictions || !matchResults) return 0;
  
  let total = 0;
  predictions.forEach(prediction => {
    const matchResult = matchResults.find(m => m.match_id === prediction.match_id);
    if (matchResult) {
      total += calculatePredictionPoints(prediction, matchResult);
    }
  });
  
  return total;
};

// Determinar si es ganador
export const isWinner = (points) => {
  return points >= 13; // MÃ­nimo 13 puntos para ganar
};

// Calcular probabilidad de ganar basado en puntaje
export const calculateProbability = (points) => {
  if (points >= 25) return 'Muy alta';
  if (points >= 20) return 'Alta';
  if (points >= 15) return 'Media';
  if (points >= 10) return 'Baja';
  return 'Muy baja';
};

// Generar colores para puntos
export const getPointsColor = (points) => {
  if (points >= 13) return '#52c41a'; // Verde - Ganador
  if (points >= 10) return '#1890ff'; // Azul - Bueno
  if (points >= 7) return '#faad14'; // Amarillo - Regular
  return '#ff4d4f'; // Rojo - Bajo
};

// Calcular ahorro en recarga de crÃ©ditos
export const calculateSavings = (plan) => {
  const normalPrice = 5000 * plan.credits;
  return normalPrice - plan.price_PTS;
};

// Calcular premio estimado
export const calculateEstimatedPrize = (betCount, prizePerCredit = 1950) => {
  return betCount * prizePerCredit;
};

// Verificar si puede ganar
export const canWinPrize = (points, minPoints = 13) => {
  return points >= minPoints;
};

