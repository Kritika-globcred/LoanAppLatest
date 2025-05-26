type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogContext = {
  [key: string]: unknown;
  timestamp?: string;
  error?: {
    name?: string;
    message: string;
    stack?: string;
    code?: string | number;
  };
  component?: string;
  userId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  requestId?: string;
};

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LOG_LEVEL = (process.env.NEXT_PUBLIC_LOG_LEVEL || 'error') as LogLevel;

/**
 * Enhanced logger with structured logging and error handling
 */
class Logger {
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL];
  }

  private formatMessage(level: LogLevel, message: string, context: LogContext = {}): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...context,
    };
    
    // Stringify the log entry for console output
    return JSON.stringify(logEntry, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value
    );
  }

  private log(level: LogLevel, message: string, context: LogContext = {}) {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, {
      ...context,
      timestamp: new Date().toISOString(),
    });

    switch (level) {
      case 'debug':
        console.debug(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        this.reportToErrorService(message, context);
        break;
    }
  }

  debug(message: string, context: LogContext = {}) {
    this.log('debug', message, context);
  }

  info(message: string, context: LogContext = {}) {
    this.log('info', message, context);
  }

  warn(message: string, context: LogContext = {}) {
    this.log('warn', message, context);
  }

  error(message: string, error?: unknown, context: LogContext = {}) {
    const errorContext: LogContext = { ...context };

    // Extract error information if available
    if (error instanceof Error) {
      errorContext.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...(error as any).code && { code: (error as any).code },
      };
    } else if (error) {
      errorContext.error = {
        message: String(error),
      };
    }

    this.log('error', message, errorContext);
  }

  /**
   * Log API request details
   */
  apiRequest(
    method: string,
    path: string,
    context: LogContext = {}
  ) {
    this.info(`API Request: ${method} ${path}`, {
      ...context,
      method,
      path,
      type: 'api.request',
    });
  }

  /**
   * Log API response details
   */
  apiResponse(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context: LogContext = {}
  ) {
    const level = statusCode >= 400 ? 'warn' : 'info';
    this[level](`API Response: ${method} ${path} ${statusCode} (${duration}ms)`, {
      ...context,
      method,
      path,
      statusCode,
      duration,
      type: 'api.response',
    });
  }

  /**
   * Report errors to external service in production
   */
  private reportToErrorService(message: string, context: LogContext) {
    if (process.env.NODE_ENV !== 'production') return;

    try {
      // Example: Send to your logging service
      // fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     level: 'error',
      //     message,
      //     ...context,
      //   }),
      // });
    } catch (e) {
      console.error('Failed to report error to service:', e);
    }
  }
}

export const logger = new Logger();

// Helper function to create a child logger with additional context
export function createLogger(initialContext: LogContext) {
  return {
    debug: (message: string, context: LogContext = {}) =>
      logger.debug(message, { ...initialContext, ...context }),
    info: (message: string, context: LogContext = {}) =>
      logger.info(message, { ...initialContext, ...context }),
    warn: (message: string, context: LogContext = {}) =>
      logger.warn(message, { ...initialContext, ...context }),
    error: (message: string, error?: unknown, context: LogContext = {}) =>
      logger.error(message, error, { ...initialContext, ...context }),
    apiRequest: (method: string, path: string, context: LogContext = {}) =>
      logger.apiRequest(method, path, { ...initialContext, ...context }),
    apiResponse: (
      method: string,
      path: string,
      statusCode: number,
      duration: number,
      context: LogContext = {}
    ) =>
      logger.apiResponse(method, path, statusCode, duration, {
        ...initialContext,
        ...context,
      }),
  };
}
