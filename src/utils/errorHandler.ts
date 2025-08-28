/**
 * Error handling utilities for consistent error management across the app
 */

export interface AuthError {
  isAuthError: boolean;
  message: string;
  originalError: Error;
}

/**
 * Check if an error is related to authentication
 */
export const isAuthenticationError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  const authErrorIndicators = [
    'Authentication token not found',
    'Token is expired',
    'Given token not valid',
    'token_not_valid',
    'Unauthorized',
  ];

  return authErrorIndicators.some(indicator =>
    error.message.toLowerCase().includes(indicator.toLowerCase())
  );
};

/**
 * Parse error and determine if it's an authentication error
 */
export const parseError = (error: unknown): AuthError => {
  const errorObj = error instanceof Error ? error : new Error('Unknown error');

  return {
    isAuthError: isAuthenticationError(error),
    message: errorObj.message,
    originalError: errorObj,
  };
};

/**
 * Handle API errors consistently
 */
export const handleApiError = (
  error: unknown,
  showToast: (message: string, type: 'error' | 'success' | 'info') => void,
  defaultMessage: string = 'Произошла ошибка. Попробуйте позже.'
): AuthError => {
  const parsedError = parseError(error);

  console.error('API Error:', parsedError.originalError);

  // Don't show toast for auth errors as user will be logged out automatically
  if (!parsedError.isAuthError) {
    showToast(defaultMessage, 'error');
  }

  return parsedError;
};

/**
 * Check if we should retry an operation based on the error
 */
export const shouldRetryOperation = (error: unknown): boolean => {
  const parsedError = parseError(error);

  // Don't retry authentication errors
  if (parsedError.isAuthError) {
    return false;
  }

  // Check for network-related errors that might be temporary
  const retryableErrors = [
    'Network request failed',
    'timeout',
    'connection',
    'ECONNREFUSED',
    'ETIMEDOUT',
  ];

  return retryableErrors.some(indicator =>
    parsedError.message.toLowerCase().includes(indicator.toLowerCase())
  );
};

/**
 * Get user-friendly error message
 */
export const getUserFriendlyErrorMessage = (
  error: unknown,
  defaultMessage: string = 'Произошла ошибка. Попробуйте позже.'
): string => {
  const parsedError = parseError(error);

  if (parsedError.isAuthError) {
    return 'Сессия истекла. Пожалуйста, войдите в систему снова.';
  }

  // Network errors
  if (parsedError.message.toLowerCase().includes('network')) {
    return 'Проблема с подключением к интернету. Проверьте соединение.';
  }

  // Timeout errors
  if (parsedError.message.toLowerCase().includes('timeout')) {
    return 'Запрос истек. Пожалуйста, попробуйте еще раз.';
  }

  // Server errors (5xx)
  if (parsedError.message.includes('status: 5')) {
    return 'Сервер временно недоступен. Попробуйте позже.';
  }

  // Client errors (4xx, but not 401 which is handled as auth error)
  if (parsedError.message.includes('status: 4')) {
    return 'Некорректный запрос. Обратитесь в поддержку.';
  }

  return defaultMessage;
};

/**
 * Retry mechanism with exponential backoff
 */
export const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry auth errors
      if (!shouldRetryOperation(error)) {
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        break;
      }

      // Wait before retrying with exponential backoff
      const delay = initialDelay * Math.pow(2, attempt);
      console.log(`Operation failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries + 1})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

export default {
  isAuthenticationError,
  parseError,
  handleApiError,
  shouldRetryOperation,
  getUserFriendlyErrorMessage,
  retryWithBackoff,
};
