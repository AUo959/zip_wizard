/**
 * Error Boundary Component
 * 
 * Catches and handles errors gracefully in the component tree.
 * Provides fallback UI and recovery options.
 */

import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Download, HelpCircle } from 'lucide-react';

interface ErrorBoundaryProps {
  /** Child components */
  children: ReactNode;
  /** Fallback UI to render on error */
  fallback?: (error: Error, errorInfo: React.ErrorInfo, reset: () => void) => ReactNode;
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Optional identifier for this boundary */
  boundaryId?: string;
  /** Whether to show detailed error info (dev mode) */
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * ErrorBoundary component for catching and handling React errors
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught error:', {
      boundaryId: this.props.boundaryId,
      error,
      errorInfo,
    });

    this.setState({
      errorInfo,
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleExportLog = (): void => {
    const { error, errorInfo } = this.state;
    const { boundaryId } = this.props;

    const log = {
      boundaryId,
      timestamp: new Date().toISOString(),
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
      },
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    const blob = new Blob([JSON.stringify(log, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-log-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  handleGetHelp = (): void => {
    // Could open help docs or support modal
    console.log('Help requested for error:', this.state.error);
    // TODO: Replace with proper modal/toast system
    // For now, just log to console - this should be integrated with the app's notification system
    if (typeof window !== 'undefined') {
      // This is a placeholder - should be replaced with app's modal system
      console.info('Help documentation would open here. Error has been logged to console.');
    }
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, boundaryId, showDetails } = this.props;

    if (!hasError) {
      return children;
    }

    // Use custom fallback if provided
    if (fallback && error && errorInfo) {
      return fallback(error, errorInfo, this.handleReset);
    }

    // Default error UI
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6 bg-background">
        <Card className="max-w-2xl w-full border-destructive">
          <CardHeader>
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-destructive mt-1" />
              <div>
                <CardTitle className="text-destructive">
                  Something went wrong
                </CardTitle>
                <CardDescription>
                  {boundaryId ? `Error in ${boundaryId}` : 'An unexpected error occurred'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTitle>Error Details</AlertTitle>
              <AlertDescription className="mt-2">
                <code className="text-sm">{error?.message || 'Unknown error'}</code>
              </AlertDescription>
            </Alert>

            {showDetails && errorInfo?.componentStack && (
              <div className="bg-muted p-4 rounded-md max-h-48 overflow-auto">
                <pre className="text-xs whitespace-pre-wrap">
                  {errorInfo.componentStack}
                </pre>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button onClick={this.handleReset} className="flex items-center space-x-2">
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </Button>
              <Button
                onClick={this.handleExportLog}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export Error Log</span>
              </Button>
              <Button
                onClick={this.handleGetHelp}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Get Help</span>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              If this problem persists, please export the error log and contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
}

/**
 * Hook-based error boundary for functional components
 * Note: This is a wrapper around the class-based ErrorBoundary
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> => {
  return (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
};
