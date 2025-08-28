import ApiClient from './client';
import {apiConfig, API_ENDPOINTS} from './config';
import {StorageService} from '../utils/storage';

export interface ApiNotification {
  id: number;
  type: string;
  text: string;
  appeal: string;
  is_read: boolean;
}

export interface NotificationListResponse {
  limit: number;
  offset: number;
  count: number;
  next: string | null;
  previous: string | null;
  results: ApiNotification[];
}

export interface MarkAsReadResponse {
  id: number;
  type: string;
  text: string;
  appeal: string;
  is_read: boolean;
}

class NotificationsService {
  private client: ApiClient;
  private tokenExpirationHandler?: () => Promise<void>;

  constructor() {
    this.client = new ApiClient(apiConfig.baseURL, apiConfig.timeout);
  }

  setTokenExpirationHandler(handler: () => Promise<void>) {
    this.client.setTokenExpirationHandler(handler);
    this.tokenExpirationHandler = handler;
  }

  async getNotifications(): Promise<NotificationListResponse> {
    // Get token from storage for authenticated requests
    const token = await this.getAuthToken();
    if (!token) {
      if (this.tokenExpirationHandler) {
        console.log(
          'No authentication token found for notifications, triggering logout...',
        );
        await this.tokenExpirationHandler();
      }
      throw new Error('Authentication token not found');
    }
    const headers = {Authorization: `Bearer ${token}`};

    return this.client.get<NotificationListResponse>(
      API_ENDPOINTS.NOTIFICATIONS_LIST,
      headers,
    );
  }

  async markAsRead(notificationId: number): Promise<MarkAsReadResponse> {
    const token = await this.getAuthToken();
    if (!token) {
      if (this.tokenExpirationHandler) {
        console.log(
          'No authentication token found for marking notification as read, triggering logout...',
        );
        await this.tokenExpirationHandler();
      }
      throw new Error('Authentication token not found');
    }
    const headers = {Authorization: `Bearer ${token}`};

    return await this.client.put<MarkAsReadResponse>(
      `${API_ENDPOINTS.NOTIFICATIONS_DETAIL}/${notificationId}`,
      {is_read: true},
      headers,
    );
  }

  async getNotificationDetail(
    notificationId: number,
  ): Promise<ApiNotification> {
    const token = await this.getAuthToken();
    if (!token) {
      if (this.tokenExpirationHandler) {
        console.log(
          'No authentication token found for notification detail, triggering logout...',
        );
        await this.tokenExpirationHandler();
      }
      throw new Error('Authentication token not found');
    }
    const headers = {Authorization: `Bearer ${token}`};

    return this.client.get<ApiNotification>(
      `${API_ENDPOINTS.NOTIFICATIONS_DETAIL}/${notificationId}`,
      headers,
    );
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      const token = await StorageService.getAccessToken();
      console.log(
        'Retrieved auth token:',
        token ? 'Token exists' : 'No token found',
      );
      return token;
    } catch (error) {
      console.warn('Failed to get auth token:', error);
      return null;
    }
  }

  // Test method to verify token retrieval
  async testTokenRetrieval(): Promise<void> {
    console.log('Testing token retrieval...');
    const token = await this.getAuthToken();
    console.log(
      'Token test result:',
      token ? 'SUCCESS - Token found' : 'FAILED - No token',
    );
  }
}

const notificationsService = new NotificationsService();
export default notificationsService;
