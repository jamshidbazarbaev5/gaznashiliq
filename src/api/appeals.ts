import ApiClient from './client';
import {API_ENDPOINTS, apiConfig} from './config';
import {StorageService} from '../utils/storage';

export interface AppealCategory {
  id: number;
  name: string;
  created_at?: string;
}

export interface AppealResponse {
  id: number;
  text: string;
  reference_number: string;
  response_files: AppealFile[];
  answerer: {
    full_name: string;
    phone: string;
  };
  created_at?: string;
}

export interface Appeal {
  id: number;
  reference_number: string;
  region: string;
  status: string;
  category: AppealCategory;
  created_at: string;
  text?: string;
  files?: AppealFile[]; // Changed from appeal_files to match API response
  appeal_files?: AppealFile[]; // Keep for backward compatibility
  appeal_response?: AppealResponse | null;
  sender?: AppealSender;
  sender_quantity?: number;
}

export interface AppealFile {
  id?: number;
  file: string; // File path from API
  name?: string; // Optional name extracted from path
  size?: string; // Optional size (not provided by API)
  type?: 'image' | 'pdf'; // Optional type determined by extension
}

export interface AppealSender {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  region: string;
}

export interface AppealsListResponse {
  limit: number;
  offset: number;
  count: number;
  next: string | null;
  previous: string | null;
  results: Appeal[];
}

export interface CreateAppealData {
  text: string;
  category: number;
  region?: string;
  files?: any[]; // DocumentPicker file objects
}

export interface CreateAppealResponse {
  id: number;
  appeal_number: string;
  text: string;
  category: AppealCategory;
  region?: string;
  status: string;
  created_at: string;
  files?: any[];
}

class AppealsService {
  private apiClient: ApiClient;
  private tokenExpirationHandler?: () => Promise<void>;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  setTokenExpirationHandler(handler: () => Promise<void>) {
    this.apiClient.setTokenExpirationHandler(handler);
    this.tokenExpirationHandler = handler;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await StorageService.getAccessToken();
    if (!token) {
      // If no token is found, trigger logout
      if (this.tokenExpirationHandler) {
        console.log('No authentication token found, triggering logout...');
        await this.tokenExpirationHandler();
      }
      throw new Error('Authentication token not found');
    }
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  async getCategories(): Promise<AppealCategory[]> {
    try {
      const headers = await this.getAuthHeaders();
      return await this.apiClient.get<AppealCategory[]>(
        API_ENDPOINTS.APPEALS_CATEGORIES,
        headers,
      );
    } catch (error) {
      console.error('Error fetching appeal categories:', error);
      throw error;
    }
  }

  async createAppeal(
    appealData: CreateAppealData,
  ): Promise<CreateAppealResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const formData = new FormData();

      // Add text and category
      formData.append('text', appealData.text);
      formData.append('category', appealData.category.toString());

      // Add region if provided
      if (appealData.region) {
        formData.append('region', appealData.region);
      }

      // Add files if provided
      if (appealData.files && appealData.files.length > 0) {
        appealData.files.forEach(file => {
          formData.append('files', file as any);
        });
      }

      return await this.apiClient.postFormData<CreateAppealResponse>(
        API_ENDPOINTS.APPEALS_CREATE,
        formData,
        headers,
      );
    } catch (error) {
      console.error('Error creating appeal:', error);
      throw error;
    }
  }

  async getMyAppeals(
    limit: number = 10,
    offset: number = 0,
  ): Promise<AppealsListResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await this.apiClient.get<AppealsListResponse>(
        `${API_ENDPOINTS.APPEALS_LIST}?limit=${limit}&offset=${offset}`,
        headers,
      );

      console.log('Raw API Response:', JSON.stringify(response, null, 2));

      // Ensure appeal_files is properly set for each appeal
      if (response.results) {
        response.results = response.results.map(appeal => ({
          ...appeal,
          // Preserve both properties but ensure they're arrays
          files: appeal.files || appeal.appeal_files || [],
          appeal_files: appeal.appeal_files || appeal.files || [],
        }));
      }

      return response;
    } catch (error) {
      console.error('Error fetching appeals:', error);
      throw error;
    }
  }

  async getAppealDetail(appealId: number): Promise<Appeal> {
    try {
      const headers = await this.getAuthHeaders();
      return await this.apiClient.get<Appeal>(
        `${API_ENDPOINTS.APPEALS_DETAIL}/${appealId}`,
        headers,
      );
    } catch (error) {
      console.error('Error fetching appeal detail:', error);
      throw error;
    }
  }
}

// Create and export appeals service instance
const apiClient = new ApiClient(apiConfig.baseURL, apiConfig.timeout);
const appealsService = new AppealsService(apiClient);

export default appealsService;
export {AppealsService};
