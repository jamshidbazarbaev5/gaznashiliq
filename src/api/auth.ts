import ApiClient from './client';
import {apiConfig, API_ENDPOINTS} from './config';

export interface RegistrationData {
  phone: string;
  email: string;
  full_name: string;
  region: string;
  address: string;
  password: string;
}

export interface LoginData {
  phone: string;
  password: string;
}

export interface User {
  id: string;
  phone: string;
  email: string;
  full_name: string;
  region: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
  message?: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

export interface UpdateUserData {
  full_name?: string;
  email?: string;
  phone?: string;
  region?: string;
  password?: string;
}

class AuthService {
  private apiClient: ApiClient;
  private tokenExpirationHandler?: () => Promise<void>;

  constructor() {
    this.apiClient = new ApiClient(apiConfig.baseURL, apiConfig.timeout);
  }

  setTokenExpirationHandler(handler: () => Promise<void>) {
    this.apiClient.setTokenExpirationHandler(handler);
    this.tokenExpirationHandler = handler;
  }

  async register(data: RegistrationData): Promise<AuthResponse> {
    try {
      const response = await this.apiClient.post<AuthResponse>(
        API_ENDPOINTS.USERS_CREATE,
        data,
      );
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error; // Preserve original error with detailed information
    }
  }

  async login(data: LoginData): Promise<TokenResponse> {
    try {
      const response = await this.apiClient.post<TokenResponse>(
        API_ENDPOINTS.AUTH_TOKEN,
        data,
      );
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Вход не удался. Проверьте ваши данные.');
    }
  }

  async getUserProfile(token?: string): Promise<User> {
    try {
      let authToken = token;
      if (!authToken) {
        const {StorageService} = await import('../utils/storage');
        authToken = await StorageService.getAccessToken();
        if (!authToken) {
          if (this.tokenExpirationHandler) {
            console.log(
              'No authentication token found for user profile, triggering logout...',
            );
            await this.tokenExpirationHandler();
          }
          throw new Error('Authentication token not found');
        }
      }

      const response = await this.apiClient.get<User>(API_ENDPOINTS.USERS_ME, {
        Authorization: `Bearer ${authToken}`,
      });
      return response;
    } catch (error) {
      console.error('Get user profile failed:', error);
      throw new Error('Не удалось получить профиль пользователя.');
    }
  }

  async updateUserProfile(token: string, data: UpdateUserData): Promise<User> {
    try {
      let authToken = token;
      if (!authToken) {
        const {StorageService} = await import('../utils/storage');
        authToken = await StorageService.getAccessToken();
        if (!authToken) {
          if (this.tokenExpirationHandler) {
            console.log(
              'No authentication token found for profile update, triggering logout...',
            );
            await this.tokenExpirationHandler();
          }
          throw new Error('Authentication token not found');
        }
      }

      const response = await this.apiClient.put<User>(
        API_ENDPOINTS.USERS_UPDATE,
        data,
        {
          Authorization: `Bearer ${authToken}`,
        },
      );
      return response;
    } catch (error) {
      console.error('Update user profile failed:', error);
      throw new Error('Не удалось обновить профиль пользователя.');
    }
  }

  async deleteAccount(token: string): Promise<void> {
    try {
      let authToken = token;
      if (!authToken) {
        const {StorageService} = await import('../utils/storage');
        authToken = await StorageService.getAccessToken();
        if (!authToken) {
          if (this.tokenExpirationHandler) {
            console.log(
              'No authentication token found for account deletion, triggering logout...',
            );
            await this.tokenExpirationHandler();
          }
          throw new Error('Authentication token not found');
        }
      }

      await this.apiClient.delete(API_ENDPOINTS.USERS_DELETE, {
        Authorization: `Bearer ${authToken}`,
      });
    } catch (error) {
      console.error('Delete account failed:', error);
      throw new Error('Не удалось удалить аккаунт.');
    }
  }
}

export default new AuthService();
