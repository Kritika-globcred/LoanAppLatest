import { logger } from './logger';
import { ApiError } from './apiError';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  requestId?: string;
}

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_RETRIES = 1; // 1 retry = 2 total attempts
const DEFAULT_RETRY_DELAY = 1000; // 1 second

/**
 * Enhanced fetch wrapper with timeout, retries, and error handling
 */
async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    params,
    headers = {},
    body,
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    requestId,
    ...fetchOptions
  } = options;

  // Build URL with query parameters
  const url = new URL(endpoint, window.location.origin);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  // Set up request headers
  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Add request ID if provided
  if (requestId) {
    requestHeaders['X-Request-ID'] = requestId;
  }

  // Log the request
  logger.apiRequest(method, url.pathname, {
    url: url.toString(),
    method,
    headers: requestHeaders,
    body: body ? JSON.parse(body as string) : undefined,
    requestId,
  });

  let lastError: Error | null = null;
  let attempt = 0;

  const executeRequest = async (): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const startTime = Date.now();
      const response = await fetch(url.toString(), {
        ...fetchOptions,
        method,
        headers: requestHeaders,
        body,
        signal: controller.signal,
      });
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Log the response
      logger.apiResponse(
        method,
        url.pathname,
        response.status,
        duration,
        {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          duration,
          requestId,
        }
      );

      // Handle non-2xx responses
      if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        let errorDetails: any = null;

        try {
          // Try to parse error response as JSON
          const errorResponse = await response.json().catch(() => ({}));
          
          if (errorResponse.message) {
            errorMessage = errorResponse.message;
          }
          
          errorDetails = {
            ...errorResponse,
            statusCode: response.status,
          };
        } catch (e) {
          // If we can't parse the error as JSON, use the status text
          errorMessage = response.statusText || errorMessage;
        }

        throw new ApiError(errorMessage, response.status, {
          code: errorDetails?.code,
          details: errorDetails,
        });
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError('Request timed out', 408, {
          code: 'REQUEST_TIMEOUT',
          details: { timeout },
        });
      }
      
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // Retry logic
  while (attempt <= retries) {
    try {
      const response = await executeRequest();
      
      // Handle JSON response
      if (response.headers.get('content-type')?.includes('application/json')) {
        return (await response.json()) as T;
      }
      
      // Handle text/plain response
      if (response.headers.get('content-type')?.includes('text/plain')) {
        return (await response.text()) as unknown as T;
      }
      
      // Handle empty response
      return undefined as unknown as T;
    } catch (error) {
      lastError = error as Error;
      attempt++;
      
      // Don't retry for these status codes
      if (
        error instanceof ApiError &&
        [400, 401, 403, 404, 422].includes(error.statusCode)
      ) {
        throw error;
      }
      
      // Log retry attempts
      if (attempt <= retries) {
        logger.warn(`Retrying request (${attempt}/${retries})`, {
          url: url.toString(),
          method,
          attempt,
          maxRetries: retries,
          delay: retryDelay,
          error: error instanceof Error ? error.message : String(error),
          requestId,
        });
        
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }
  
  // If we've exhausted all retries, throw the last error
  throw lastError || new Error('Unknown error occurred during API request');
}

// Convenience methods
const api = {
  get: <T = unknown>(url: string, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
    apiClient<T>(url, { ...options, method: 'GET' }),
  
  post: <T = unknown>(
    url: string,
    body?: unknown,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
  ) =>
    apiClient<T>(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  
  put: <T = unknown>(
    url: string,
    body?: unknown,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
  ) =>
    apiClient<T>(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  
  patch: <T = unknown>(
    url: string,
    body?: unknown,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
  ) =>
    apiClient<T>(url, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  
  delete: <T = unknown>(
    url: string,
    options: Omit<RequestOptions, 'method'> = {}
  ) => apiClient<T>(url, { ...options, method: 'DELETE' }),
};

export { api, apiClient };

// Example usage:
/*
// GET request
const data = await api.get<{ id: string; name: string }>('/api/users/123', {
  params: { include: 'profile' },
  requestId: 'req_123',
});

// POST request
const newUser = await api.post<{ id: string }>('/api/users', {
  name: 'John Doe',
  email: 'john@example.com',
});

// With error handling
try {
  const result = await api.get('/api/some-endpoint');
  // Handle success
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error (${error.statusCode}):`, error.message);
    // Handle specific error codes
    if (error.statusCode === 401) {
      // Handle unauthorized
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
*/
