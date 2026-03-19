// frontend/src/config/dateConfig.js
export const DATE_FORMATS = {
  DISPLAY_FULL: 'dddd, DD [de] MMMM [de] YYYY hh:mm A',
  DISPLAY_SHORT: 'DD/MM/YYYY hh:mm A',
  DISPLAY_DATE_ONLY: 'DD/MM/YYYY',
  DISPLAY_TIME_ONLY: 'hh:mm A',
  DISPLAY_TABLE_DATE: 'DD/MM',
  DISPLAY_TABLE_TIME: 'hh:mm A',
  INPUT_FORMAT: 'YYYY-MM-DDTHH:mm', // Formato para inputs
  API_FORMAT: 'YYYY-MM-DDTHH:mm:ssZ' // Formato para enviar al backend
};

export const TIMEZONE = {
  DEFAULT: 'UTC',
  LOCAL: Intl.DateTimeFormat().resolvedOptions().timeZone
};
