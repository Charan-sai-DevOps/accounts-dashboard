import React, { ReactNode, ReactElement } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Error Boundary Component
 * Catches React component errors and displays fallback UI
 * Prevents entire app from crashing due to single component error
 *
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactElement;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);

    // Log to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // sendToErrorTracking(error, errorInfo);
    }
  }

  render(): ReactElement {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div
            style={{
              padding: '20px',
              margin: '20px',
              borderRadius: '8px',
              background: '#fee2e2',
              border: '1px solid #fecaca',
            }}
          >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <AlertTriangle
                size={20}
                style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }}
              />
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: '#7f1d1d', fontWeight: 600 }}>
                  Something went wrong
                </h3>
                <p style={{ margin: '0 0 8px 0', color: '#991b1b', fontSize: '14px' }}>
                  {this.state.error?.message || 'An unexpected error occurred'}
                </p>
                {process.env.NODE_ENV === 'development' && (
                  <details style={{ marginTop: '8px', cursor: 'pointer' }}>
                    <summary style={{ color: '#991b1b', fontSize: '12px' }}>
                      Error details
                    </summary>
                    <pre
                      style={{
                        margin: '8px 0 0 0',
                        padding: '8px',
                        background: '#fca5a5',
                        borderRadius: '4px',
                        overflow: 'auto',
                        fontSize: '12px',
                      }}
                    >
                      {this.state.error?.stack}
                    </pre>
                  </details>
                )}
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    marginTop: '12px',
                    padding: '8px 16px',
                    background: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  Reload page
                </button>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children as ReactElement;
  }
}

/**
 * Wrap async operation with error catching
 * Use when you need error boundary behavior without class component
 *
 * @example
 * const SafeComponent = withErrorBoundary(RiskyComponent);
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactElement
) {
  return (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
}
