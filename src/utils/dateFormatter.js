// frontend/src/utils/dateFormatter.js
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/es';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.locale('es');

const hasTimeZoneInfo = (value) => {
  if (typeof value !== 'string') return false;
  return /Z$/.test(value) || /[+-]\d{2}:\d{2}$/.test(value);
};

// Algunos endpoints envían "Z" aunque la hora ya es local.
// En esos casos, tratar "Z" como local para evitar corrimiento.
const normalizeLocalDateString = (value) => {
  if (typeof value !== 'string') return value;
  return value.endsWith('Z') ? value.replace(/Z$/, '') : value;
};

// DEBUG: Ver qu? tipo de fecha recibes
export const debugDate = (date) => {
  if (!date) return 'No date';
  
  console.log('=== DEBUG FECHA ===');
  console.log('Fecha original:', date);
  console.log('Es string?', typeof date === 'string');
  
  if (typeof date === 'string') {
    console.log('Termina con Z?', date.endsWith('Z'));
    console.log('Contiene +00:00?', date.includes('+00:00'));
    console.log('Contiene offset?', date.match(/[+-]\d{2}:\d{2}/));
  }
  
  // Probar diferentes interpretaciones
  console.log('Interpretada como UTC:', dayjs.utc(date).format());
  console.log('Interpretada como Local:', dayjs(date).format());
  console.log('UTC -> Local:', dayjs.utc(date).local().format());
  
  return 'Debug completado';
};

// FORMATO PRINCIPAL - Versi?n inteligente
export const formatDateTime = (date) => {
  if (!date) return 'Fecha no disponible';
  
  try {
    // Si es string, analizarlo
    if (typeof date === 'string') {
      const normalized = normalizeLocalDateString(date);
      if (hasTimeZoneInfo(date) && normalized === date) {
        return dayjs(date).local().format('dddd, DD [de] MMMM [de] YYYY hh:mm A');
      }
      return dayjs(normalized).format('dddd, DD [de] MMMM [de] YYYY hh:mm A');
    }
    
    // Si ya es un objeto Date o Dayjs
    return dayjs(date).format('dddd, DD [de] MMMM [de] YYYY hh:mm A');
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return 'Fecha inv?lida';
  }
};

// Formato largo forzando origen UTC (aunque no traiga Z).
export const formatDateTimeUTC = (date) => {
  if (!date) return 'Fecha no disponible';
  try {
    if (typeof date === 'string') {
      const normalized = hasTimeZoneInfo(date) ? date : `${date}Z`;
      return dayjs.utc(normalized).local().format('dddd, DD [de] MMMM [de] YYYY hh:mm A');
    }
    return dayjs(date).format('dddd, DD [de] MMMM [de] YYYY hh:mm A');
  } catch (error) {
    console.error('Error formateando fecha UTC:', error);
    return 'Fecha invÃ¡lida';
  }
};

// Formato principal con ajuste de horas (positivo o negativo)
export const formatDateTimeWithOffset = (date, offsetHours = 0) => {
  if (!date) return 'Fecha no disponible';

  try {
    let dateObj;
    if (typeof date === 'string') {
      dateObj = hasTimeZoneInfo(date) ? dayjs.utc(date).local() : dayjs(date);
    } else {
      dateObj = dayjs(date);
    }

    return dateObj.add(offsetHours, 'hour').format('dddd, DD [de] MMMM [de] YYYY hh:mm A');
  } catch (error) {
    console.error('Error formateando fecha con ajuste:', error);
    return 'Fecha inválida';
  }
};

// Formato para tarjetas y listas
export const formatDateTimeShort = (date) => {
  if (!date) return 'Fecha no disponible';
  
  try {
    if (typeof date === 'string') {
      const normalized = normalizeLocalDateString(date);
      if (hasTimeZoneInfo(date) && normalized === date) {
        return dayjs(date).local().format('DD/MM/YYYY hh:mm A');
      }
      return dayjs(normalized).format('DD/MM/YYYY hh:mm A');
    }
    return dayjs(date).format('DD/MM/YYYY hh:mm A');
  } catch (error) {
    console.error('Error formateando fecha corta:', error);
    return 'Fecha inv?lida';
  }
};

// Formato solo fecha (sin hora)
export const formatDateOnly = (date) => {
  if (!date) return '';
  
  try {
    if (typeof date === 'string') {
      const normalized = normalizeLocalDateString(date);
      if (hasTimeZoneInfo(date) && normalized === date) {
        return dayjs(date).local().format('DD/MM/YYYY');
      }
      return dayjs(normalized).format('DD/MM/YYYY');
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
      const normalized = normalizeLocalDateString(date);
      if (hasTimeZoneInfo(date) && normalized === date) {
        return dayjs(date).local().format('hh:mm A');
      }
      return dayjs(normalized).format('hh:mm A');
    }
    return dayjs(date).format('hh:mm A');
  } catch (error) {
    return dayjs(date).isValid() ? dayjs(date).format('hh:mm A') : '';
  }
};

// Formato muy corto para tablas
export const formatDateTable = (date) => {
  if (!date) return '-';
  
  try {
    if (typeof date === 'string') {
      const normalized = normalizeLocalDateString(date);
      const dateObj = hasTimeZoneInfo(date) && normalized === date
        ? dayjs(date).local()
        : dayjs(normalized);
      return {
        date: dateObj.format('DD/MM'),
        time: dateObj.format('hh:mm A')
      };
    }
    const dateObj = dayjs(date);
    return {
      date: dateObj.format('DD/MM'),
      time: dateObj.format('hh:mm A')
    };
  } catch (error) {
    return { date: '-', time: '-' };
  }
};

// Formato para inputs de fecha
export const formatForInput = (date) => {
  if (!date) return null;
  
  try {
    if (typeof date === 'string') {
      const normalized = normalizeLocalDateString(date);
      if (hasTimeZoneInfo(date) && normalized === date) {
        return dayjs(date).local();
      }
      return dayjs(normalized);
    }
    return dayjs(date);
  } catch (error) {
    return null;
  }
};

// Serializa un Dayjs/Date a datetime local SIN zona horaria
// para evitar corrimientos UTC al guardar en backend con campos naive.
export const toBackendLocalDateTime = (value) => {
  if (!value) return null;
  try {
    return dayjs(value).format('YYYY-MM-DDTHH:mm:ss');
  } catch (error) {
    return null;
  }
};

// Formato corto interpretando la fecha como hora local de negocio
// (útil cuando el backend envía "Z" pero el valor ya representa hora local).
export const formatDateTimeShortLocal = (date) => {
  if (!date) return 'Fecha no disponible';

  try {
    if (typeof date === 'string') {
      const normalized = date.replace(/Z$/, '');
      return dayjs(normalized).format('DD/MM/YYYY hh:mm A');
    }
    return dayjs(date).format('DD/MM/YYYY hh:mm A');
  } catch (error) {
    console.error('Error formateando fecha corta local:', error);
    return 'Fecha inválida';
  }
};

// Formato solo fecha interpretando el valor como hora local (sin ajuste de zona).
export const formatDateOnlyLocal = (date) => {
  if (!date) return '';
  try {
    if (typeof date === 'string') {
      const normalized = date.replace(/Z$/, '');
      return dayjs(normalized).format('DD/MM/YYYY');
    }
    return dayjs(date).format('DD/MM/YYYY');
  } catch (error) {
    return dayjs(date).isValid() ? dayjs(date).format('DD/MM/YYYY') : '';
  }
};

// Formato solo hora interpretando el valor como hora local (sin ajuste de zona).
export const formatTimeOnlyLocal = (date) => {
  if (!date) return '';
  try {
    if (typeof date === 'string') {
      const normalized = date.replace(/Z$/, '');
      return dayjs(normalized).format('hh:mm A');
    }
    return dayjs(date).format('hh:mm A');
  } catch (error) {
    return dayjs(date).isValid() ? dayjs(date).format('hh:mm A') : '';
  }
};

// Formato solo fecha forzando origen UTC cuando el string no trae zona horaria.
export const formatDateOnlyUTC = (date) => {
  if (!date) return '';
  try {
    if (typeof date === 'string') {
      const normalized = hasTimeZoneInfo(date) ? date : `${date}Z`;
      return dayjs.utc(normalized).local().format('DD/MM/YYYY');
    }
    return dayjs(date).format('DD/MM/YYYY');
  } catch (error) {
    return dayjs(date).isValid() ? dayjs(date).format('DD/MM/YYYY') : '';
  }
};

// Formato solo hora forzando origen UTC cuando el string no trae zona horaria.
export const formatTimeOnlyUTC = (date) => {
  if (!date) return '';
  try {
    if (typeof date === 'string') {
      const normalized = hasTimeZoneInfo(date) ? date : `${date}Z`;
      return dayjs.utc(normalized).local().format('hh:mm A');
    }
    return dayjs(date).format('hh:mm A');
  } catch (error) {
    return dayjs(date).isValid() ? dayjs(date).format('hh:mm A') : '';
  }
};

// Formato corto forzando que el valor origen está en UTC (aunque no traiga Z).
// Útil cuando backend envía datetime naive pero realmente representa UTC.
export const formatDateTimeShortUTC = (date) => {
  if (!date) return 'Fecha no disponible';

  try {
    if (typeof date === 'string') {
      const normalized = hasTimeZoneInfo(date) ? date : `${date}Z`;
      return dayjs.utc(normalized).local().format('DD/MM/YYYY hh:mm A');
    }
    return dayjs(date).format('DD/MM/YYYY hh:mm A');
  } catch (error) {
    console.error('Error formateando fecha corta UTC:', error);
    return 'Fecha inválida';
  }
};

// Parser local para comparaciones de fecha/hora en UI.
export const parseDateAsLocal = (date) => {
  if (!date) return null;
  try {
    if (typeof date === 'string') {
      const normalized = date.replace(/Z$/, '');
      const parsed = dayjs(normalized);
      return parsed.isValid() ? parsed : null;
    }
    const parsed = dayjs(date);
    return parsed.isValid() ? parsed : null;
  } catch (error) {
    return null;
  }
};

// Parser forzando origen UTC para comparaciones en UI.
export const parseDateAsUTC = (date) => {
  if (!date) return null;
  try {
    if (typeof date === 'string') {
      const normalized = hasTimeZoneInfo(date) ? date : `${date}Z`;
      const parsed = dayjs.utc(normalized).local();
      return parsed.isValid() ? parsed : null;
    }
    const parsed = dayjs(date);
    return parsed.isValid() ? parsed : null;
  } catch (error) {
    return null;
  }
};

// Forzar interpretacion UTC cuando el string no trae zona horaria
export const formatForInputUTC = (date) => {
  if (!date) return null;

  try {
    if (typeof date === 'string') {
      if (hasTimeZoneInfo(date)) {
        return dayjs.utc(date).local();
      }
      return dayjs.utc(date).local();
    }
    return dayjs(date);
  } catch (error) {
    return null;
  }
};

// Formato muy corto para tablas, forzando UTC si no hay zona
export const formatDateTableUTC = (date) => {
  if (!date) return { date: '-', time: '-' };

  try {
    const dateObj = typeof date === 'string'
      ? (hasTimeZoneInfo(date) ? dayjs.utc(date).local() : dayjs.utc(date).local())
      : dayjs(date);
    return {
      date: dateObj.format('DD/MM'),
      time: dateObj.format('hh:mm A')
    };
  } catch (error) {
    return { date: '-', time: '-' };
  }
};

