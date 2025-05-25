import { logger } from './logger';

/**
 * Set up global error handling for the application
 * This should be called once when the app starts
 */
export function setupGlobalErrorHandling() {
  if (typeof window === 'undefined') return; // Only run in browser

  // Handle uncaught exceptions
  const originalOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    logger.error(
      'Uncaught error',
      error || new Error(String(message)),
      {
        source,
        lineno,
        colno,
        type: 'uncaught',
      }
    );

    // Call any existing handler
    if (typeof originalOnError === 'function') {
      return originalOnError.call(window, message, source, lineno, colno, error);
    }

    // Return true to prevent the default browser error handler
    return true;
  };

  // Handle unhandled promise rejections
  window.onunhandledrejection = (event: PromiseRejectionEvent) => {
    const error = event.reason;
    logger.error(
      'Unhandled promise rejection',
      error instanceof Error ? error : new Error(String(error)),
      { 
        type: 'unhandledrejection',
        event: event.type,
      }
    );
  };

  // Handle React error boundaries
  if (process.env.NODE_ENV === 'development') {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Check for React error boundary errors
      if (args[0] && typeof args[0] === 'string' && args[0].includes('React will try to recreate this component tree')) {
        logger.error(
          'React error boundary caught an error',
          new Error('React component error'),
          { 
            componentStack: args[1],
            type: 'react.error-boundary',
          }
        );
      }
      originalConsoleError.apply(console, args);
    };
  }
}

/**
 * Helper function to wrap async functions with error handling
 */
export function withErrorHandling<T extends any[]>(fn: (...args: T) => Promise<void>) {
  return async (...args: T) => {
    try {
      await fn(...args);
    } catch (error) {
      logger.error('Error in async function', error, {
        functionName: fn.name || 'anonymous',
        type: 'async-function',
      });
      throw error; // Re-throw to allow further error handling
    }
  };
}

/**
 * Error class for API errors with status codes
 */
export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    
    // Maintain proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

/**
 * Helper to create consistent error responses
 */
export function createErrorResponse(
  error: unknown,
  options: { defaultMessage?: string; defaultStatus?: number } = {}
) {
  const { defaultMessage = 'An unexpected error occurred', defaultStatus = 500 } = options;
  
  if (error instanceof ApiError) {
    const response: {
      status: number;
      message: string;
      details?: unknown;
    } = {
      status: error.statusCode,
      message: error.message,
    };
    
    if (error.details) {
      response.details = error.details;
    }
    
    return response;
  }
  
  if (error instanceof Error) {
    const response: {
      status: number;
      message: string;
      stack?: string;
    } = {
      status: defaultStatus,
      message: error.message || defaultMessage,
    };
    
    if (process.env.NODE_ENV === 'development' && error.stack) {
      response.stack = error.stack;
    }
    
    return response;
  }
  
  return {
    status: defaultStatus,
    message: defaultMessage,
  };
}
