class ApiClient {
  private baseURL: string;
  private timeout: number;
  private onTokenExpired?: () => Promise<void>;

  constructor(baseURL: string, timeout: number = 10000) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  setTokenExpirationHandler(handler: () => Promise<void>) {
    this.onTokenExpired = handler;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // Create default headers as plain object
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    // Merge headers properly
    const finalHeaders = {
      ...defaultHeaders,
      ...(options.headers as Record<string, string>),
    };

    const config: RequestInit = {
      ...options,
      headers: finalHeaders,
    };

    try {
      console.log('Making API request to:', url);
      console.log('Request method:', config.method || 'GET');
      console.log('Request headers:', JSON.stringify(finalHeaders, null, 2));
      console.log('Request body:', config.body);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      // First try to ping the server
      try {
        const pingController = new AbortController();
        const pingTimeout = setTimeout(() => pingController.abort(), 5000);
        
        await fetch(this.baseURL, {
          method: 'HEAD',
          signal: pingController.signal
        });
        
        clearTimeout(pingTimeout);
      } catch (pingError) {
        console.error('Server ping failed:', pingError);
        throw new Error('Сервер недоступен. Пожалуйста, попробуйте позже.');
      }

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
        // Add additional headers that might help with CORS/SSL
        headers: {
          ...config.headers,
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
        },
      }).catch(error => {
        console.error('Fetch error details:', error);
        
        if (error.name === 'AbortError') {
          throw new Error('Запрос истек. Пожалуйста, проверьте подключение к интернету.');
        }
        if (error.message === 'Network request failed') {
          throw new Error('Проверьте подключение к интернету или попробуйте позже.');
        }
        throw error;
      });

      clearTimeout(timeoutId);

      console.log('Response status:', response.status);
      console.log('Response status text:', response.statusText);

      const responseHeadersObj: Record<string, string> = {};
      response.headers.forEach((value: string, key: string) => {
        responseHeadersObj[key] = value;
      });
      console.log(
        'Response headers:',
        JSON.stringify(responseHeadersObj, null, 2),
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);

        // Handle token expiration
        if (response.status === 401 && this.onTokenExpired) {
          try {
            const errorData = JSON.parse(errorText);
            const isTokenExpired =
              errorData?.message?.code === 'token_not_valid' ||
              errorData?.message?.detail?.includes('Token is expired') ||
              errorData?.message?.detail?.includes('Given token not valid');

            if (isTokenExpired) {
              console.log('Token expired, triggering logout...');
              await this.onTokenExpired();
            }
          } catch (parseError) {
            // If we can't parse the error, still check for 401
            console.log('401 error received, triggering logout...');
            await this.onTokenExpired();
          }
        }

        throw new Error(
          `HTTP error! status: ${response.status}, body: ${errorText}`,
        );
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('Response data:', JSON.stringify(data, null, 2));
        return data;
      } else {
        const text = await response.text();
        console.log('Non-JSON response:', text);
        return text as T;
      }
    } catch (error) {
      console.error('API request failed:', error);
      if (
        error instanceof TypeError &&
        error.message === 'Network request failed'
      ) {
        throw new Error(
          'Проблема с подключением к интернету. Проверьте соединение.',
        );
      }
      throw error;
    }
  }

  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      headers,
    });
  }

  async post<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async postFormData<T>(
    endpoint: string,
    formData: FormData,
    headers?: Record<string, string>,
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // Don't set Content-Type for FormData - let the browser set it with boundary
    const finalHeaders = {
      Accept: 'application/json',
      ...(headers || {}),
    };

    const config: RequestInit = {
      method: 'POST',
      headers: finalHeaders,
      body: formData,
    };

    try {
      console.log('Making FormData API request to:', url);
      console.log('Request method:', config.method);
      console.log('Request headers:', JSON.stringify(finalHeaders, null, 2));

      const response = await fetch(url, config);

      console.log('Response status:', response.status);
      console.log('Response status text:', response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);

        // Handle token expiration
        if (response.status === 401 && this.onTokenExpired) {
          try {
            const errorData = JSON.parse(errorText);
            const isTokenExpired =
              errorData?.message?.code === 'token_not_valid' ||
              errorData?.message?.detail?.includes('Token is expired') ||
              errorData?.message?.detail?.includes('Given token not valid');

            if (isTokenExpired) {
              console.log('Token expired, triggering logout...');
              await this.onTokenExpired();
            }
          } catch (parseError) {
            // If we can't parse the error, still check for 401
            console.log('401 error received, triggering logout...');
            await this.onTokenExpired();
          }
        }

        throw new Error(
          `HTTP error! status: ${response.status}, body: ${errorText}`,
        );
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('Response data:', JSON.stringify(data, null, 2));
        return data;
      } else {
        const text = await response.text();
        console.log('Non-JSON response:', text);
        return text as T;
      }
    } catch (error) {
      console.error('FormData API request failed:', error);
      if (
        error instanceof TypeError &&
        error.message === 'Network request failed'
      ) {
        throw new Error(
          'Проблема с подключением к интернету. Проверьте соединение.',
        );
      }
      throw error;
    }
  }

  async put<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(
    endpoint: string,
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      headers,
    });
  }
}

export default ApiClient;
