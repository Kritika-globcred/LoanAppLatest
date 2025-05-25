'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { logger } from '@/utils/logger';
import { isApiError } from '@/utils/apiError';

interface ErrorPageProps {
  error: Error & { 
    digest?: string; 
    statusCode?: number; 
    code?: string;
    details?: unknown;
  };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const router = useRouter();
  const [isReporting, setIsReporting] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  
  // Extract error details
  const statusCode = error.statusCode || 500;
  const errorCode = error.code || 'UNKNOWN_ERROR';
  const isClientError = statusCode >= 400 && statusCode < 500;
  const isServerError = statusCode >= 500;
  const isApiErrorFlag = isApiError(error);

  useEffect(() => {
    // Log the error
    const errorDetails = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      statusCode,
      code: errorCode,
      path: typeof window !== 'undefined' ? window.location.pathname : undefined,
      type: 'nextjs-page-error',
    };
    
    logger.error('Page error', error, errorDetails);
  }, [error, statusCode, errorCode]);

  const handleReset = () => {
    try {
      reset();
    } catch (resetError) {
      logger.error('Error resetting component', resetError);
      // If reset fails, redirect to home
      router.push('/');
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleReportError = async () => {
    if (reportSubmitted) return;
    
    setIsReporting(true);
    
    try {
      // In a real app, you would send this to your error reporting service
      await logger.error('User reported page error', error, {
        path: typeof window !== 'undefined' ? window.location.pathname : undefined,
        digest: error.digest,
        statusCode,
        code: errorCode,
        type: 'user-reported-page-error',
      });
      
      setReportSubmitted(true);
    } catch (reportError) {
      logger.error('Failed to report error', reportError);
    } finally {
      setIsReporting(false);
    }
  };

  // Get appropriate error message based on status code
  const getErrorMessage = () => {
    if (isApiErrorFlag) {
      return error.message || 'An error occurred';
    }
    
    switch (statusCode) {
      case 404:
        return 'The page you are looking for does not exist.';
      case 401:
        return 'You are not authorized to view this page.';
      case 403:
        return 'You do not have permission to access this resource.';
      case 500:
        return 'An internal server error occurred. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div 
          className={`p-6 text-white ${
            isServerError ? 'bg-red-600' : 
            isClientError ? 'bg-amber-600' : 'bg-blue-600'
          }`}
        >
          <h1 className="text-2xl font-bold mb-2">
            {statusCode} - {isServerError ? 'Server Error' : isClientError ? 'Client Error' : 'Error'}
          </h1>
          <p className="opacity-90">{getErrorMessage()}</p>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-2">What happened?</h2>
              <p className="text-gray-700 dark:text-gray-300">
                {isServerError 
                  ? 'Our servers encountered an error while processing your request. Our team has been notified and we\'re working to fix it.'
                  : isClientError
                    ? 'There was a problem with your request. Please check the details and try again.'
                    : 'An unexpected error occurred. We apologize for the inconvenience.'}
              </p>
            </div>
            
            <div className="space-y-3 pt-2">
              <Button
                onClick={handleReset}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isReporting}
              >
                {isReporting ? 'Processing...' : 'Try Again'}
              </Button>
              
              <div className="flex space-x-3">
                <Button
                  onClick={handleGoHome}
                  variant="outline"
                  className="flex-1"
                  disabled={isReporting}
                >
                  Go to Homepage
                </Button>
                
                <Button
                  onClick={handleReportError}
                  variant="ghost"
                  className="flex-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
                  disabled={isReporting || reportSubmitted}
                >
                  {reportSubmitted ? 'Reported ✓' : 'Report Error'}
                </Button>
              </div>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Error Details</h3>
                  <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded">
                    {statusCode} {errorCode}
                  </span>
                </div>
                <pre className="text-xs text-gray-600 dark:text-gray-300 overflow-auto max-h-60 p-2 bg-white dark:bg-gray-800 rounded">
                  {error.stack || error.message}
                </pre>
                {error.digest && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Digest:</span> {error.digest}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
