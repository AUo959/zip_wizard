/**
 * Error boundary for Archive UI.
 * Catch rendering/extraction errors and display actionable UI.
 * Never crash the whole app or lose partial progress.
 */

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (_error: Error, _errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error boundary component for graceful error handling.
 * Catches errors in child components and displays a fallback UI.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console
    console.error('Archive Error Caught by Boundary:', error, errorInfo);

    // Store error info
    this.setState({
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Optionally log to error reporting service
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <div className="max-w-2xl w-full space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Archive Loading Failed</AlertTitle>
              <AlertDescription>
                An error occurred while processing the archive. This may be due to a corrupted file
                or unsupported format.
              </AlertDescription>
            </Alert>

            {/* Error details */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Error Details:</h3>
              <pre className="bg-muted p-4 rounded-md overflow-auto text-xs max-h-[200px]">
                {this.state.error?.message || 'Unknown error'}
                {this.state.errorInfo?.componentStack && (
                  <>
                    {'\n\nComponent Stack:'}
                    {this.state.errorInfo.componentStack}
                  </>
                )}
              </pre>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={this.handleReset} variant="default">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={() => {
                  // Copy error to clipboard
                  const errorText = `${this.state.error?.message}\n\n${this.state.errorInfo?.componentStack || ''}`;
                  navigator.clipboard.writeText(errorText);
                }}
                variant="outline"
              >
                Copy Error Details
              </Button>
            </div>

            {/* Help text */}
            <p className="text-sm text-muted-foreground">
              If this problem persists, try uploading a different archive or contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
