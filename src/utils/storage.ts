import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  APPEAL_RATINGS: 'appeal_ratings',
};

export class StorageService {
  // Test AsyncStorage availability and handle iOS simulator issues
  private static async ensureStorageAvailability(): Promise<boolean> {
    try {
      const testKey = '__storage_test__';
      await AsyncStorage.setItem(testKey, 'test');
      await AsyncStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn('AsyncStorage is not available:', error);
      return false;
    }
  }

  // Wrapper for AsyncStorage.setItem with fallback handling
  private static async safeSetItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error: any) {
      console.error(`Error setting item ${key}:`, error);

      // If it's an iOS simulator directory issue, try to handle it gracefully
      if (Platform.OS === 'ios' && error?.message?.includes('manifest.json')) {
        console.warn(
          'iOS Simulator storage issue detected. Attempting fallback...',
        );

        // Try to clear AsyncStorage and retry
        try {
          await AsyncStorage.clear();
          await AsyncStorage.setItem(key, value);
          console.log(`Successfully stored ${key} after clearing storage`);
        } catch (fallbackError) {
          console.error(`Fallback storage failed for ${key}:`, fallbackError);
          throw fallbackError;
        }
      } else {
        throw error;
      }
    }
  }

  // Wrapper for AsyncStorage.getItem with error handling
  private static async safeGetItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  }
  // Token management
  static async setAccessToken(token: string): Promise<void> {
    try {
      if (!token) {
        throw new Error('Access token cannot be empty or undefined');
      }
      await this.safeSetItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    } catch (error) {
      console.error('Error storing access token:', error);
      throw error;
    }
  }

  static async getAccessToken(): Promise<string | null> {
    try {
      return await this.safeGetItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error retrieving access token:', error);
      return null;
    }
  }

  static async setRefreshToken(token: string): Promise<void> {
    try {
      if (!token) {
        throw new Error('Refresh token cannot be empty or undefined');
      }
      await this.safeSetItem(STORAGE_KEYS.REFRESH_TOKEN, token);
    } catch (error) {
      console.error('Error storing refresh token:', error);
      throw error;
    }
  }

  static async getRefreshToken(): Promise<string | null> {
    try {
      return await this.safeGetItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error retrieving refresh token:', error);
      return null;
    }
  }

  static async setTokens(
    accessToken: string,
    refreshToken: string,
  ): Promise<void> {
    try {
      if (!accessToken || !refreshToken) {
        throw new Error('Both access token and refresh token are required');
      }

      // Check storage availability first
      const storageAvailable = await this.ensureStorageAvailability();
      if (!storageAvailable) {
        console.warn('Storage not available, tokens will not persist');
        return;
      }

      await Promise.all([
        this.safeSetItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
        this.safeSetItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
      ]);
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw error;
    }
  }

  static async clearTokens(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
      ]);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  // User data management
  static async setUserData(userData: any): Promise<void> {
    try {
      await this.safeSetItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      console.error('Error storing user data:', error);
      // Don't throw error for user data, as it's not critical for authentication
    }
  }

  static async getUserData(): Promise<any | null> {
    try {
      const userData = await this.safeGetItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return null;
    }
  }

  static async clearUserData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }

  // Appeal ratings management
  static async setAppealRating(
    appealId: string,
    rating: number,
  ): Promise<void> {
    try {
      const existingRatings = await this.getAppealRatings();
      const updatedRatings = {
        ...existingRatings,
        [appealId]: rating,
      };
      await this.safeSetItem(
        STORAGE_KEYS.APPEAL_RATINGS,
        JSON.stringify(updatedRatings),
      );
    } catch (error) {
      console.error('Error storing appeal rating:', error);
    }
  }

  static async getAppealRating(appealId: string): Promise<number | null> {
    try {
      const ratings = await this.getAppealRatings();
      return ratings[appealId] || null;
    } catch (error) {
      console.error('Error retrieving appeal rating:', error);
      return null;
    }
  }

  static async getAppealRatings(): Promise<{[key: string]: number}> {
    try {
      const ratings = await this.safeGetItem(STORAGE_KEYS.APPEAL_RATINGS);
      return ratings ? JSON.parse(ratings) : {};
    } catch (error) {
      console.error('Error retrieving appeal ratings:', error);
      return {};
    }
  }

  // Clear all data
  static async clearAll(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
        AsyncStorage.removeItem(STORAGE_KEYS.APPEAL_RATINGS),
      ]);
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    try {
      const accessToken = await this.safeGetItem(STORAGE_KEYS.ACCESS_TOKEN);
      return !!accessToken;
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  }
}

export default StorageService;
