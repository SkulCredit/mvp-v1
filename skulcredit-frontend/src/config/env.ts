export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  IS_PRODUCTION: import.meta.env.PROD as boolean,
  APP_NAME: 'SkulCredit',
} as const;
