const API_BASE_URL = 'https://eappeal.uz/api';

export const API_ENDPOINTS = {
  USERS_CREATE: '/users/create/',
  USERS_ME: '/users/me',
  USERS_UPDATE: '/users/me/update/',
  USERS_DELETE: '/users/me/delete/',
  AUTH_TOKEN: '/auth/token/',
  APPEALS_CREATE: '/appeals/create/',
  APPEALS_CATEGORIES: '/appeals/category/list',
  APPEALS_LIST: '/appeals/me',
  APPEALS_DETAIL: '/appeals',
  NOTIFICATIONS_LIST: '/notifications/list',
  NOTIFICATIONS_DETAIL: '/notifications',
  RESPONSES_RATE: '/responses', // Will be used as /responses/{response_id}/rate/
  // Add more endpoints as needed
};

export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased timeout to 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
};

export default apiConfig;
