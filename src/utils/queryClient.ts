import { 
  QueryClient, 
  QueryFunctionContext, 
  QueryCache,
  MutationCache
} from '@tanstack/react-query';
import { logger } from './logger';
import { isApiError } from './apiError';

/**
 * Default query function for React Query
 * This will be used as the default query function for all queries
 * that don't specify their own query function
 */
export const defaultQueryFn = async <T = unknown>({
  queryKey,
  signal,
  meta,
}: QueryFunctionContext): Promise<T> => {
  const [url, params = {}] = queryKey as [string, Record<string, unknown>?];
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(meta?.headers || {}),
      },
      signal,
      ...(Object.keys(params).length > 0 && { 
        body: JSON.stringify(params) 
      }),
    });

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

      // Create a standard error object with the error details
      const error = new Error(errorMessage) as Error & { 
        statusCode: number; 
        code?: string; 
        details?: unknown;
      };
      
      error.statusCode = response.status;
      error.code = errorDetails?.code;
      error.details = errorDetails;
      
      throw error;
    }

    return response.json();
  } catch (error) {
    // Check if it's an error with status code (like our custom error above)
    if (error instanceof Error && 'statusCode' in error) {
      const apiError = error as Error & { 
        statusCode: number; 
        code?: string; 
        details?: unknown;
      };
      
      logger.error(`Query error: ${error.message}`, error, {
        url,
        params,
        statusCode: apiError.statusCode,
        code: apiError.code,
        details: apiError.details,
      });
      throw error;
    }
    
    // Handle standard errors
    if (error instanceof Error) {
      logger.error('Unexpected error in query function', error, { url, params });
      throw error;
    }
    
    // Handle non-Error thrown values
    const errorMessage = typeof error === 'string' ? error : 'An unknown error occurred';
    const unknownError = new Error(errorMessage);
    logger.error('Unexpected error in query function', unknownError, { url, params });
    throw unknownError;
  }
};

/**
 * Create a new QueryClient with default options
 */
/**
 * Create a new QueryClient with default options and error handling
 */
export const createQueryClient = () => {
  // Create query cache with error handler
  const queryCache = new QueryCache({
    onError: (error: unknown) => {
      if (isApiError(error)) {
        logger.error(`Query error: ${error.message}`, error, {
          statusCode: error.statusCode,
          code: error.code,
          details: error.details,
        });
      } else if (error instanceof Error) {
        logger.error('Unexpected query error', error);
      } else {
        logger.error('Unknown query error', { error });
      }
    },
  });

  // Create mutation cache with error handler
  const mutationCache = new MutationCache({
    onError: (error: unknown) => {
      if (isApiError(error)) {
        logger.error(`Mutation error: ${error.message}`, error, {
          statusCode: error.statusCode,
          code: error.code,
          details: error.details,
        });
      } else if (error instanceof Error) {
        logger.error('Unexpected mutation error', error);
      } else {
        logger.error('Unknown mutation error', { error });
      }
    },
  });

  return new QueryClient({
    queryCache,
    mutationCache,
    defaultOptions: {
      queries: {
        queryFn: defaultQueryFn,
        retry: (failureCount, error: unknown) => {
          // Don't retry for 4xx errors (except 408 - Request Timeout)
          if (
            isApiError(error) && 
            error.statusCode >= 400 && 
            error.statusCode < 500 &&
            error.statusCode !== 408
          ) {
            return false;
          }
          
          // Retry up to 3 times for other errors
          return failureCount < 3;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v5+)
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: true,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      },
    },
  });
};

/**
 * Helper to handle query errors in UI components
 */
export function handleQueryError(error: unknown): {
  status: number;
  message: string;
  code?: string;
  details?: unknown;
} {
  if (isApiError(error)) {
    return {
      status: error.statusCode,
      message: error.message,
      code: error.code,
      details: error.details,
    };
  }

  // Handle network errors
  if (error instanceof Error && error.name === 'TypeError' && 'message' in error) {
    return {
      status: 0,
      message: 'Network error. Please check your connection and try again.',
      code: 'NETWORK_ERROR',
    };
  }

  // Handle AbortError (request was cancelled)
  if (error instanceof DOMException && error.name === 'AbortError') {
    return {
      status: 0,
      message: 'Request was cancelled',
      code: 'REQUEST_CANCELLED',
    };
  }

  // Handle unknown errors
  return {
    status: 500,
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Helper to create query keys with type safety
 */
export const queryKeys = {
  // Example:
  // user: {
  //   all: ['user'] as const,
  //   lists: () => [...queryKeys.user.all, 'list'] as const,
  //   list: (filters: UserFilters) => 
  //     [...queryKeys.user.lists(), { filters }] as const,
  //   detail: (id: string) => [...queryKeys.user.all, id] as const,
  // },
};

// Example usage:
/*
// In your component
const { data, isLoading, error } = useQuery({
  queryKey: ['/api/users', { status: 'active' }],
  // No need to specify queryFn if using defaultQueryFn
});

// With error handling
const { data, isLoading, error } = useQuery({
  queryKey: ['/api/users/123'],
  // Custom query function
  queryFn: async ({ signal }) => {
    const response = await fetch('/api/users/123', { signal });
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    return response.json();
  },
});

// Error handling in UI
if (error) {
  const { status, message } = handleQueryError(error);
  return <div>Error {status}: {message}</div>;
}
*/

// Create and export a single query client instance
export const queryClient = createQueryClient();
