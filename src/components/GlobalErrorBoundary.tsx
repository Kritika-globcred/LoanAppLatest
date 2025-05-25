'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/utils/logger';

export interface GlobalErrorBoundaryProps {
  children: ReactNode;
  /** Component name for better error tracking */
  componentName?: string;
  /** Custom fallback component */
  fallback?: ReactNode;
  /** Callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Show error details in development */
  showErrorDetails?: boolean;
  /** Custom error message */
  errorMessage?: string;
  /** Whether to log the error */
  logError?: boolean;
  /** Additional context for the error */
  errorContext?: Record<string, unknown>;
}

interface GlobalErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId?: string;
}

/**
 * Global error boundary component that catches JavaScript errors in its child component tree,
 * logs those errors, and displays a fallback UI.
 */
export class GlobalErrorBoundary extends Component<
  GlobalErrorBoundaryProps,
  GlobalErrorBoundaryState
> {
  public static defaultProps: Partial<GlobalErrorBoundaryProps> = {
    showErrorDetails: process.env.NODE_ENV === 'development',
    errorMessage: 'Something went wrong',
    logError: true,
  };

  public state: GlobalErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<GlobalErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `ui_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { componentName, onError, logError, errorContext = {} } = this.props;
    const { errorId } = this.state;
    
    // Log the error with context
    if (logError) {
      logger.error(
        `Error in ${componentName || 'component'}: ${error.message}`,
        error,
        {
          componentName,
          errorId,
          ...errorContext,
          componentStack: errorInfo.componentStack,
          type: 'react.error-boundary',
        }
      );
    }

    // Update state with error info
    this.setState({ errorInfo });

    // Call any additional error handlers
    if (onError) {
      onError(error, errorInfo);
    }
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReportError = (): void => {
    const { error, errorInfo, errorId } = this.state;
    const { componentName } = this.props;
    
    // In a real app, you would send this to your error reporting service
    logger.error(
      'User reported error',
      error || new Error('Unknown error'),
      {
        componentName,
        errorId,
        type: 'user-reported',
        ...(errorInfo && { componentStack: errorInfo.componentStack }),
      }
    );
    
    // Show feedback to user
    alert('Thank you for reporting this issue. Our team has been notified.');
  };

  public render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const {
      children,
      fallback,
      showErrorDetails,
      errorMessage = 'Something went wrong',
      componentName,
    } = this.props;

    if (!hasError) {
      return children;
    }

    // Use custom fallback if provided
    if (fallback) {
      return fallback;
    }

    // Default error UI
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-red-600 p-4 text-white">
            <h1 className="text-xl font-bold">{errorMessage}</h1>
          </div>
          
          <div className="p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-12 w-12 text-red-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  We're sorry, but something went wrong.
                </h3>
                <div className="mt-2 text-sm text-gray-600">
                  <p>
                    Our team has been notified about this issue. Please try refreshing the page or
                    contact support if the problem persists.
                  </p>
                  
                  {showErrorDetails && error && (
                    <details className="mt-4 border border-gray-200 rounded-md p-3">
                      <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                        Show error details
                      </summary>
                      <div className="mt-2 text-xs font-mono bg-gray-50 p-2 rounded overflow-auto max-h-60">
                        <p className="font-semibold">
                          {error.name}: {error.message}
                        </p>
                        {componentName && (
                          <p className="mt-1 text-gray-500">Component: {componentName}</p>
                        )}
                        {error.stack && (
                          <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto text-xs">
                            {error.stack}
                          </pre>
                        )}
                        {errorInfo?.componentStack && (
                          <div className="mt-2">
                            <p className="font-semibold">Component Stack:</p>
                            <pre className="mt-1 p-2 bg-gray-100 rounded overflow-auto text-xs">
                              {errorInfo.componentStack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                </div>
                
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={this.handleReset}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Try again
                  </button>
                  <button
                    type="button"
                    onClick={this.handleReportError}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Report issue
                  </button>
                  <a
                    href="/"
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Go to home
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default GlobalErrorBoundary;
