import ApiClient from './client';
import {API_ENDPOINTS, apiConfig} from './config';
import {StorageService} from '../utils/storage';

export interface RatingData {
  rating: number; // 1-5 scale
}

export interface RatingResponse {
  id: number;
  rating: number;
  response_id: number;
  created_at: string;
  updated_at: string;
}

class RatingService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  setTokenExpirationHandler(handler: () => Promise<void>) {
    this.apiClient.setTokenExpirationHandler(handler);
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await StorageService.getAccessToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Submit a rating for a response
   * @param responseId - The ID of the response to rate
   * @param rating - Rating value (1-5)
   * @returns Promise<RatingResponse>
   */
  async submitRating(
    responseId: number,
    rating: number,
  ): Promise<RatingResponse> {
    try {
      // Validate rating value
      if (!rating || rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      if (!responseId || responseId <= 0) {
        throw new Error('Valid response ID is required');
      }

      const headers = await this.getAuthHeaders();
      const ratingData: RatingData = {rating};

      const endpoint = `${API_ENDPOINTS.RESPONSES_RATE}/${responseId}/rate/`;

      return await this.apiClient.post<RatingResponse>(
        endpoint,
        ratingData,
        headers,
      );
    } catch (error) {
      console.error('Error submitting rating:', error);
      throw error;
    }
  }

  /**
   * Get rating for a specific response (if needed in the future)
   * @param responseId - The ID of the response
   * @returns Promise<RatingResponse | null>
   */
  async getRating(responseId: number): Promise<RatingResponse | null> {
    try {
      if (!responseId || responseId <= 0) {
        throw new Error('Valid response ID is required');
      }

      const headers = await this.getAuthHeaders();
      const endpoint = `${API_ENDPOINTS.RESPONSES_RATE}/${responseId}/rating/`;

      return await this.apiClient.get<RatingResponse>(endpoint, headers);
    } catch (error) {
      console.error('Error fetching rating:', error);
      // Return null if rating doesn't exist instead of throwing
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Update an existing rating
   * @param responseId - The ID of the response
   * @param rating - New rating value (1-5)
   * @returns Promise<RatingResponse>
   */
  async updateRating(
    responseId: number,
    rating: number,
  ): Promise<RatingResponse> {
    try {
      // Validate rating value
      if (!rating || rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      if (!responseId || responseId <= 0) {
        throw new Error('Valid response ID is required');
      }

      const headers = await this.getAuthHeaders();
      const ratingData: RatingData = {rating};

      const endpoint = `${API_ENDPOINTS.RESPONSES_RATE}/${responseId}/rate`;

      // Use PUT for updates
      return await this.apiClient.put<RatingResponse>(
        endpoint,
        ratingData,
        headers,
      );
    } catch (error) {
      console.error('Error updating rating:', error);
      throw error;
    }
  }
}

// Create and export rating service instance
const apiClient = new ApiClient(apiConfig.baseURL, apiConfig.timeout);
const ratingService = new RatingService(apiClient);

export default ratingService;
export {RatingService};
