/**
 * Test utility to verify authentication token handling and logout behavior
 */

import {StorageService} from './storage';
import appealsService from '../api/appeals';
import authService from '../api/auth';
import notificationsService from '../api/notifications';

interface TestResult {
  testName: string;
  passed: boolean;
  error?: string;
  details?: string;
}

class AuthTestUtils {
  private results: TestResult[] = [];

  /**
   * Run all authentication tests
   */
  async runAllTests(): Promise<TestResult[]> {
    this.results = [];

    await this.testTokenRetrieval();
    await this.testAppealsServiceWithoutToken();
    await this.testAuthServiceWithoutToken();
    await this.testNotificationsServiceWithoutToken();
    await this.testTokenExpirationHandler();

    return this.results;
  }

  /**
   * Test token retrieval from storage
   */
  private async testTokenRetrieval(): Promise<void> {
    try {
      const token = await StorageService.getAccessToken();
      this.addResult('Token Retrieval', true, undefined, `Token: ${token ? 'Found' : 'Not found'}`);
    } catch (error) {
      this.addResult('Token Retrieval', false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Test appeals service behavior without token
   */
  private async testAppealsServiceWithoutToken(): Promise<void> {
    try {
      // Clear tokens to simulate no auth state
      await StorageService.clearTokens();

      // Try to get appeals - should trigger logout handler
      await appealsService.getMyAppeals();

      this.addResult('Appeals Service Without Token', false, 'Should have thrown authentication error');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isAuthError = errorMessage.includes('Authentication token not found');

      this.addResult(
        'Appeals Service Without Token',
        isAuthError,
        isAuthError ? undefined : `Unexpected error: ${errorMessage}`,
        `Error: ${errorMessage}`
      );
    }
  }

  /**
   * Test auth service behavior without token
   */
  private async testAuthServiceWithoutToken(): Promise<void> {
    try {
      // Clear tokens to simulate no auth state
      await StorageService.clearTokens();

      // Try to get user profile - should handle missing token
      await authService.getUserProfile();

      this.addResult('Auth Service Without Token', false, 'Should have thrown authentication error');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isAuthError = errorMessage.includes('Authentication token not found');

      this.addResult(
        'Auth Service Without Token',
        isAuthError,
        isAuthError ? undefined : `Unexpected error: ${errorMessage}`,
        `Error: ${errorMessage}`
      );
    }
  }

  /**
   * Test notifications service behavior without token
   */
  private async testNotificationsServiceWithoutToken(): Promise<void> {
    try {
      // Clear tokens to simulate no auth state
      await StorageService.clearTokens();

      // Try to get notifications - should trigger logout handler
      await notificationsService.getNotifications();

      this.addResult('Notifications Service Without Token', false, 'Should have thrown authentication error');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isAuthError = errorMessage.includes('Authentication token not found');

      this.addResult(
        'Notifications Service Without Token',
        isAuthError,
        isAuthError ? undefined : `Unexpected error: ${errorMessage}`,
        `Error: ${errorMessage}`
      );
    }
  }

  /**
   * Test token expiration handler setup
   */
  private async testTokenExpirationHandler(): Promise<void> {
    try {
      let logoutHandlerCalled = false;

      // Create a mock logout handler
      const mockLogoutHandler = async () => {
        logoutHandlerCalled = true;
        console.log('Mock logout handler called');
      };

      // Set the handler on all services
      appealsService.setTokenExpirationHandler(mockLogoutHandler);
      authService.setTokenExpirationHandler(mockLogoutHandler);
      notificationsService.setTokenExpirationHandler(mockLogoutHandler);

      // Clear tokens to simulate no auth state
      await StorageService.clearTokens();

      // Try to make an API call - should trigger logout handler
      try {
        await appealsService.getMyAppeals();
      } catch (error) {
        // Expected to fail, we're just checking if the handler was called
      }

      this.addResult(
        'Token Expiration Handler',
        logoutHandlerCalled,
        logoutHandlerCalled ? undefined : 'Logout handler was not called',
        `Handler called: ${logoutHandlerCalled}`
      );
    } catch (error) {
      this.addResult(
        'Token Expiration Handler',
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Simulate authentication token expiration scenario
   */
  async simulateTokenExpiration(): Promise<void> {
    console.log('🧪 Simulating token expiration scenario...');

    // Clear all tokens
    await StorageService.clearTokens();
    console.log('✅ Tokens cleared');

    // Try to make API calls
    console.log('🔄 Attempting API calls without token...');

    try {
      await appealsService.getMyAppeals();
    } catch (error) {
      console.log('📱 Appeals service error:', error);
    }

    try {
      await authService.getUserProfile();
    } catch (error) {
      console.log('👤 Auth service error:', error);
    }

    try {
      await notificationsService.getNotifications();
    } catch (error) {
      console.log('🔔 Notifications service error:', error);
    }
  }

  /**
   * Add test result
   */
  private addResult(testName: string, passed: boolean, error?: string, details?: string): void {
    this.results.push({
      testName,
      passed,
      error,
      details,
    });
  }

  /**
   * Print test results to console
   */
  printResults(): void {
    console.log('\n🧪 Authentication Test Results:');
    console.log('================================');

    this.results.forEach((result, index) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${index + 1}. ${result.testName}: ${status}`);

      if (result.details) {
        console.log(`   Details: ${result.details}`);
      }

      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }

      console.log('');
    });

    const passedCount = this.results.filter(r => r.passed).length;
    const totalCount = this.results.length;
    console.log(`Summary: ${passedCount}/${totalCount} tests passed`);
  }

  /**
   * Check current authentication state
   */
  async checkAuthState(): Promise<void> {
    console.log('\n🔍 Checking Current Authentication State:');
    console.log('=========================================');

    try {
      const accessToken = await StorageService.getAccessToken();
      const refreshToken = await StorageService.getRefreshToken();
      const userData = await StorageService.getUserData();

      console.log(`Access Token: ${accessToken ? '✅ Present' : '❌ Missing'}`);
      console.log(`Refresh Token: ${refreshToken ? '✅ Present' : '❌ Missing'}`);
      console.log(`User Data: ${userData ? '✅ Present' : '❌ Missing'}`);

      if (userData) {
        console.log(`User: ${userData.full_name} (${userData.email})`);
      }
    } catch (error) {
      console.log('❌ Error checking auth state:', error);
    }
  }
}

export const authTestUtils = new AuthTestUtils();
export default authTestUtils;
