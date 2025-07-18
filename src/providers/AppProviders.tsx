'use client';

import { ReactNode, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';
import { setupGlobalErrorHandling } from '@/utils/globalErrorHandler';
import { queryClient } from '@/utils/queryClient';
import { logger } from '@/utils/logger';

interface AppProvidersProps {
  children: ReactNode;
  /** Whether to enable React Query devtools */
  enableDevtools?: boolean;
  /** Whether to enable error boundaries in production */
  enableErrorBoundary?: boolean;
  /** Initial authentication state */
  initialAuthState?: any;
}

/**
 * AppProviders component that wraps the application with all necessary providers
 * and sets up global error handling
 */
export function AppProviders({
  children,
  enableDevtools = process.env.NODE_ENV === 'development',
  enableErrorBoundary = true,
  initialAuthState,
}: AppProvidersProps) {
  // Set up global error handling
  useEffect(() => {
    setupGlobalErrorHandling();
    
    // Log app initialization
    logger.info('Application initialized', {
      env: process.env.NODE_ENV,
      version: process.env.NEXT_PUBLIC_APP_VERSION,
    });
    
    // Clean up global event listeners on unmount
    return () => {
      // Any cleanup code if needed
    };
  }, []);

  // Wrap children with providers
  let content = (
    <QueryClientProvider client={queryClient}>
      {children}
      {enableDevtools && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );

  // Add error boundary in production if enabled
  if (enableErrorBoundary) {
    content = (
      <GlobalErrorBoundary
        componentName="App"
        onError={(error, errorInfo) => {
          logger.error('Unhandled error in App', error, {
            componentStack: errorInfo.componentStack,
            type: 'unhandled-error-boundary',
          });
        }}
      >
        {content}
      </GlobalErrorBoundary>
    );
  }

  return content;
}

export default AppProviders;
