import { logger } from './logger';

/**
 * Standard error codes for API responses
 */
export const ErrorCodes = {
  // 4xx Client Errors
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  NOT_ACCEPTABLE: 'NOT_ACCEPTABLE',
  CONFLICT: 'CONFLICT',
  GONE: 'GONE',
  UNPROCESSABLE_ENTITY: 'UNPROCESSABLE_ENTITY',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  
  // 5xx Server Errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // Custom Business Logic Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INVALID_OPERATION: 'INVALID_OPERATION',
  RESOURCE_EXHAUSTED: 'RESOURCE_EXHAUSTED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
} as const;

type ErrorCode = keyof typeof ErrorCodes;

/**
 * Standard error response format
 */
export interface ErrorResponse {
  statusCode: number;
  message: string;
  code?: string;
  details?: unknown;
  stack?: string;
  timestamp?: string;
  path?: string;
  requestId?: string;
  validationErrors?: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
}

/**
 * Options for creating an API error
 */
export interface ApiErrorOptions {
  /**
   * A machine-readable error code
   */
  code?: string;
  
  /**
   * Additional error details
   */
  details?: unknown;
  
  /**
   * The underlying cause of the error
   */
  cause?: Error;
  
  /**
   * Whether to log the error (default: true for server errors)
   */
  logError?: boolean;
  
  /**
   * Additional context for the error
   */
  context?: Record<string, unknown>;
  
  /**
   * Request path where the error occurred
   */
  path?: string;
  
  /**
   * Request ID for tracing
   */
  requestId?: string;
}

/**
 * Options for validation errors
 */
export interface ValidationErrorOptions extends Omit<ApiErrorOptions, 'details'> {
  validationErrors: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
}

/**
 * Options for rate limiting errors
 */
export interface RateLimitErrorOptions extends ApiErrorOptions {
  /**
   * Number of seconds to wait before retrying
   */
  retryAfter?: number;
  
  /**
   * Current rate limit
   */
  limit?: number;
  
  /**
   * Remaining requests in the current window
   */
  remaining?: number;
  
  /**
   * When the rate limit will reset (ISO timestamp)
   */
  resetAt?: string;
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  /**
   * HTTP status code
   */
  statusCode: number;
  
  /**
   * Additional error details
   */
  details?: unknown;
  
  /**
   * Machine-readable error code
   */
  code?: string;
  
  /**
   * Timestamp when the error occurred
   */
  timestamp: string;
  
  /**
   * Request path where the error occurred
   */
  path?: string;
  
  /**
   * Request ID for tracing
   */
  requestId?: string;
  
  /**
   * Additional context for the error
   */
  context?: Record<string, unknown>;
  
  /**
   * Whether the error was logged
   */
  logged: boolean = false;

  constructor(
    message: string, 
    statusCode: number, 
    options: ApiErrorOptions = {}
  ) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = options.code;
    this.details = options.details;
    this.context = options.context;
    this.path = options.path;
    this.requestId = options.requestId;
    this.timestamp = new Date().toISOString();
    
    // Set logged flag if this is a server error and logError is not explicitly false
    this.logged = statusCode >= 500 && options.logError !== false;
    
    // Log the error if needed
    if (this.logged) {
      this.logError();
    }
    
    // Maintain proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
  
  /**
   * Log the error with additional context
   */
  logError() {
    if (this.logged) return;
    
    const logContext = {
      code: this.code,
      statusCode: this.statusCode,
      path: this.path,
      requestId: this.requestId,
      timestamp: this.timestamp,
      ...this.context,
    };
    
    if (this.statusCode >= 500) {
      logger.error(this.message, this.cause || this, logContext);
    } else if (this.statusCode >= 400) {
      logger.warn(this.message, logContext);
    } else {
      logger.info(this.message, logContext);
    }
    
    this.logged = true;
  }

  /**
   * Create a 400 Bad Request error
   */
  static badRequest(
    message: string = 'Bad Request', 
    options: Omit<ApiErrorOptions, 'code'> & { code?: string } = {}
  ) {
    return new ApiError(message, 400, {
      code: ErrorCodes.BAD_REQUEST,
      ...options,
    });
  }

  /**
   * Create a 401 Unauthorized error
   */
  static unauthorized(
    message: string = 'Unauthorized',
    options: { code?: string; details?: unknown; cause?: Error } = {}
  ) {
    return new ApiError(message, 401, options);
  }

  /**
   * Create a 403 Forbidden error
   */
  static forbidden(
    message: string = 'Forbidden',
    options: { code?: string; details?: unknown; cause?: Error } = {}
  ) {
    return new ApiError(message, 403, options);
  }

  /**
   * Create a 404 Not Found error
   */
  static notFound(
    message: string = 'Not Found',
    options: { code?: string; details?: unknown; cause?: Error } = {}
  ) {
    return new ApiError(message, 404, options);
  }

  /**
   * Create a 409 Conflict error
   */
  static conflict(
    message: string = 'Conflict',
    options: { code?: string; details?: unknown; cause?: Error } = {}
  ) {
    return new ApiError(message, 409, options);
  }

  /**
   * Create a 422 Unprocessable Entity error with validation errors
   */
  static validationError(
    message: string = 'Validation Error',
    options: ValidationErrorOptions
  ) {
    const { validationErrors, ...rest } = options;
    return new ApiError(message, 422, {
      code: ErrorCodes.VALIDATION_ERROR,
      details: {
        validationErrors,
      },
      ...rest,
    });
  }
  
  /**
   * Create a 422 Unprocessable Entity error
   */
  static unprocessableEntity(
    message: string = 'Unprocessable Entity',
    options: Omit<ApiErrorOptions, 'code'> & { code?: string } = {}
  ) {
    return new ApiError(message, 422, {
      code: ErrorCodes.UNPROCESSABLE_ENTITY,
      ...options,
    });
  }

  /**
   * Create a 429 Too Many Requests error
   */
  static tooManyRequests(
    message: string = 'Too Many Requests',
    options: Omit<RateLimitErrorOptions, 'code'> & { 
      code?: string;
      retryAfter?: number; // in seconds
    } = {}
  ) {
    const { retryAfter, ...rest } = options;
    
    return new ApiError(message, 429, {
      code: ErrorCodes.TOO_MANY_REQUESTS,
      details: {
        ...(options.details as object || {}),
        retryAfter,
        limit: options.limit,
        remaining: options.remaining,
        resetAt: options.resetAt,
      },
      ...rest,
    });
  }

  /**
   * Create a 500 Internal Server Error
   */
  static internal(
    message: string = 'Internal Server Error',
    options: Omit<ApiErrorOptions, 'code'> & { 
      code?: string;
    } = {}
  ) {
    return new ApiError(message, 500, {
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
      logError: options.logError !== false, // Default to true if not explicitly false
      ...options,
    });
  }
  
  /**
   * Create a 503 Service Unavailable error
   */
  static serviceUnavailable(
    message: string = 'Service Unavailable',
    options: Omit<ApiErrorOptions, 'code'> & {
      code?: string;
      /**
       * When the service is expected to be available again
       */
      retryAfter?: number | string;
    } = {}
  ) {
    const { retryAfter, ...rest } = options;
    
    return new ApiError(message, 503, {
      code: ErrorCodes.SERVICE_UNAVAILABLE,
      details: {
        ...(options.details as object || {}),
        retryAfter,
      },
      ...rest,
    });
  }

  /**
   * Convert the error to a plain object for JSON responses
   */
  toJSON(): ErrorResponse {
    const response: ErrorResponse = {
      statusCode: this.statusCode,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp,
      path: this.path,
      requestId: this.requestId,
    };

    // Only include details if they exist
    if (this.details) {
      response.details = this.details;
    }

    // Only include stack trace in development
    if (process.env.NODE_ENV === 'development' && this.stack) {
      response.stack = this.stack;
    }
    
    // Include validation errors if they exist
    if (this.code === ErrorCodes.VALIDATION_ERROR && 
        this.details && 
        typeof this.details === 'object' && 
        this.details !== null && 
        'validationErrors' in this.details) {
      response.validationErrors = (this.details as any).validationErrors;
    }

    return response;
  }
  
  /**
   * Add context to the error
   */
  withContext(context: Record<string, unknown>): this {
    this.context = { ...(this.context || {}), ...context };
    return this;
  }
  
  /**
   * Set the request path
   */
  withPath(path: string): this {
    this.path = path;
    return this;
  }
  
  /**
   * Set the request ID
   */
  withRequestId(requestId: string): this {
    this.requestId = requestId;
    return this;
  }
}

/**
 * Type guard to check if an error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Handle API errors and return a consistent response
 */
export function handleApiError(error: unknown): ErrorResponse {
  // If it's already an ApiError, convert it to a response
  if (isApiError(error)) {
    // Ensure the error is logged if it hasn't been already
    if (!error.logged && error.statusCode >= 500) {
      error.logError();
    }
    return error.toJSON();
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    logger.error('Unhandled error', error);
    
    return {
      statusCode: 500,
      message: 'Internal Server Error',
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack,
      } : {})
    };
  }
  
  // Handle non-Error thrown values (strings, objects, etc.)
  logger.error('Unhandled non-Error value', { error });
  
  return {
    statusCode: 500,
    message: 'Internal Server Error',
    code: ErrorCodes.INTERNAL_SERVER_ERROR,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' ? {
      details: error
    } : {})
  };
}

/**
 * Helper to create a standardized error response
 */
export function createErrorResponse(error: unknown, request?: Request): Response {
  const errorResponse = handleApiError(error);
  const status = errorResponse.statusCode || 500;
  
  // Add CORS headers if this is a CORS request
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (request) {
    // Add CORS headers if this is a CORS request
    const origin = request.headers.get('origin');
    if (origin) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Vary'] = 'Origin';
    }
    
    // Add rate limit headers if this is a rate limit error
    if (status === 429 && 
        errorResponse.details && 
        typeof errorResponse.details === 'object' && 
        errorResponse.details !== null &&
        'retryAfter' in errorResponse.details) {
      const retryAfter = (errorResponse.details as any).retryAfter;
      if (retryAfter !== undefined && retryAfter !== null) {
        headers['Retry-After'] = String(retryAfter);
      }
    }
  }
  
  return new Response(JSON.stringify(errorResponse), {
    status,
    headers,
  });
}

/**
 * Helper to create a type-safe API response
 */
export function createApiResponse<T>(
  data: T,
  options: {
    status?: number;
    headers?: Record<string, string>;
    request?: Request;
  } = {}
): Response {
  const status = options.status || 200;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Add CORS headers if this is a CORS request
  if (options.request) {
    const origin = options.request.headers.get('origin');
    if (origin) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Vary'] = 'Origin';
    }
  }
  
  // Merge with any custom headers
  Object.assign(headers, options.headers || {});

  return new Response(JSON.stringify(data), {
    status,
    headers,
  });
}

/**
 * Helper to create a paginated API response
 */
export function createPaginatedResponse<T>(
  data: T[],
  options: {
    page: number;
    pageSize: number;
    total: number;
    request?: Request;
    headers?: Record<string, string>;
  }
): Response {
  const { page, pageSize, total, request, ...rest } = options;
  const totalPages = Math.ceil(total / pageSize);
  
  const response = {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
  
  // Add Link header for pagination
  const headers: Record<string, string> = {
    ...rest.headers,
  };
  
  if (request) {
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}${url.pathname}`;
    
    const links: string[] = [];
    
    // First page
    url.searchParams.set('page', '1');
    links.push(`<${baseUrl}?${url.searchParams.toString()}>; rel="first"`);
    
    // Previous page
    if (page > 1) {
      url.searchParams.set('page', String(page - 1));
      links.push(`<${baseUrl}?${url.searchParams.toString()}>; rel="prev"`);
    }
    
    // Next page
    if (page < totalPages) {
      url.searchParams.set('page', String(page + 1));
      links.push(`<${baseUrl}?${url.searchParams.toString()}>; rel="next"`);
    }
    
    // Last page
    url.searchParams.set('page', String(totalPages));
    links.push(`<${baseUrl}?${url.searchParams.toString()}>; rel="last"`);
    
    headers['Link'] = links.join(', ');
  }
  
  return createApiResponse(response, {
    status: 200,
    headers,
    request,
  });
}
