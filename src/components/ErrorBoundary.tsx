'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/utils/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  /** Component name for better error tracking */
  componentName?: string;
  /** Callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Show error details in development */
  showErrorDetails?: boolean;
  /** Custom error message */
  errorMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId?: string;
}

/**
 * ErrorBoundary component that catches JavaScript errors in its child component tree,
 * logs those errors, and displays a fallback UI.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public static defaultProps: Partial<ErrorBoundaryProps> = {
    showErrorDetails: process.env.NODE_ENV === 'development',
    errorMessage: 'Something went wrong',
  };

  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { 
      hasError: true,
      error,
      errorId: `err_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { componentName, onError } = this.props;
    const { errorId } = this.state;
    
    // Log the error with proper error handling
    const errorContext = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      errorInfo,
      componentName,
      errorId,
      timestamp: new Date().toISOString(),
    };
    
    logger.error(
      `Error in ${componentName || 'component'}: ${error.message}`,
      errorContext
    );

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
    // In a real app, you would send this to your error reporting service
    console.log('Report error:', { error, errorInfo, errorId });
    // Example: errorTrackingService.reportError({ error, errorInfo, errorId });
  };

  public render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showErrorDetails, errorMessage } = this.props;

    if (!hasError) {
      return children;
    }

    // Use custom fallback if provided
    if (fallback) {
      return fallback;
    }

    // Default error UI
    return (
      <div className="p-6 max-w-3xl mx-auto bg-red-50 border-l-4 border-red-500">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-red-800">
              {errorMessage}
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>We've encountered an unexpected error. Our team has been notified.</p>
              {showErrorDetails && error && (
                <details className="mt-4 bg-white p-3 rounded border border-red-200">
                  <summary className="text-sm font-medium text-red-800 cursor-pointer">
                    Error Details
                  </summary>
                  <div className="mt-2 font-mono text-xs overflow-auto">
                    <p className="font-semibold">{error.name}: {error.message}</p>
                    <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                      {error.stack || 'No stack trace available'}
                    </pre>
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
            <div className="mt-4 flex space-x-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={this.handleReportError}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Report issue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
