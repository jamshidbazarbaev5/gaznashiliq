import {useCallback} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {useNavigation} from '@react-navigation/native';
import {Alert} from 'react-native';

export interface ApiError extends Error {
  status?: number;
  body?: string;
}

export const useApiErrorHandler = () => {
  const {logout} = useAuth();
  const navigation = useNavigation();

  const handleApiError = useCallback(
    async (error: any, customErrorMessage?: string) => {
      console.error('API Error:', error);

      // Check if error contains 401 status or token expiration messages
      const isTokenExpired =
        error?.message?.includes('401') ||
        error?.message?.includes('token_not_valid') ||
        error?.message?.includes('Token is expired') ||
        error?.message?.includes('Given token not valid');

      if (isTokenExpired) {
        try {
          await logout();
          Alert.alert(
            'Сессия истекла',
            'Срок действия сессии истек. Войдите в систему заново.',
            [
              {
                text: 'OK',
                onPress: () => {
                  navigation.navigate('Login' as never);
                },
              },
            ],
          );
          return true; // Indicates that logout was performed
        } catch (logoutError) {
          console.error('Error during logout:', logoutError);
        }
        return true;
      }

      // Handle other types of errors
      let errorMessage =
        customErrorMessage || 'Произошла ошибка. Попробуйте снова.';

      if (error?.message?.includes('Network request failed')) {
        errorMessage =
          'Проблема с подключением к интернету. Проверьте соединение.';
      } else if (error?.message?.includes('400')) {
        errorMessage =
          'Неверные данные. Проверьте правильность заполнения полей.';
      } else if (error?.message?.includes('403')) {
        errorMessage = 'Доступ запрещен.';
      } else if (error?.message?.includes('404')) {
        errorMessage = 'Ресурс не найден.';
      } else if (error?.message?.includes('500')) {
        errorMessage = 'Ошибка сервера. Попробуйте позже.';
      }

      if (!customErrorMessage) {
        Alert.alert('Ошибка', errorMessage);
      }
      return false; // Indicates that no logout was performed
    },
    [logout, navigation],
  );

  return {handleApiError};
};

export default useApiErrorHandler;
