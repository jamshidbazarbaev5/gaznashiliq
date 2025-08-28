import appealsService from '../api/appeals';
import { Alert } from 'react-native';

/**
 * Test utility to demonstrate token expiration handling
 * This function can be called from any screen to test the automatic logout functionality
 */
export const testTokenExpiration = async () => {
  try {
    console.log('Testing token expiration handling...');

    // This will trigger a 401 error if the token is expired
    await appealsService.getCategories();

    console.log('Token is still valid - no expiration detected');
    Alert.alert('Тест', 'Токен действителен. Для тестирования используйте истекший токен.');

  } catch (error: any) {
    console.log('Token expiration test - caught error:', error);

    // Check if this looks like a token expiration error
    if (error?.message?.includes('401') ||
        error?.message?.includes('token_not_valid') ||
        error?.message?.includes('Token is expired')) {

      console.log('Token expiration detected! The system should automatically log out the user.');
      // The API manager should automatically handle logout at this point

    } else {
      console.log('Different type of error:', error.message);
      Alert.alert('Ошибка', 'Произошла другая ошибка: ' + error.message);
    }
  }
};

/**
 * Simulate a token expiration scenario for testing purposes
 * This creates a mock 401 error to test the error handling system
 */
export const simulateTokenExpiration = (): Error => {
  const mockError = new Error(
    'HTTP error! status: 401, body: {"message":{"detail":"Token is expired","code":"token_not_valid","messages":[{"token_class":"AccessToken","token_type":"access","message":"Token is expired"}]},"extra":{}}'
  );

  return mockError;
};

/**
 * Test the error handler with different types of errors
 */
export const testErrorHandling = {
  tokenExpired: () => simulateTokenExpiration(),

  networkError: () => new Error('Network request failed'),

  badRequest: () => new Error('HTTP error! status: 400, body: Bad request'),

  serverError: () => new Error('HTTP error! status: 500, body: Internal server error'),

  notFound: () => new Error('HTTP error! status: 404, body: Not found'),
};

/**
 * Instructions for testing token expiration:
 *
 * 1. Import this function in any screen:
 *    import { testTokenExpiration } from '../utils/tokenExpirationTest';
 *
 * 2. Add a test button to your screen:
 *    <TouchableOpacity onPress={testTokenExpiration}>
 *      <Text>Test Token Expiration</Text>
 *    </TouchableOpacity>
 *
 * 3. To test with expired token:
 *    - Use an actually expired token in storage, OR
 *    - Modify the API endpoint temporarily to return 401, OR
 *    - Use the simulateTokenExpiration function with handleApiError
 *
 * 4. Expected behavior when token is expired:
 *    - User is automatically logged out
 *    - All stored data is cleared
 *    - User sees "Сессия истекла" message
 *    - User is redirected to login screen
 */
