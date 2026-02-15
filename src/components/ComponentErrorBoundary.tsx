import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { ErrorService } from '../services/ErrorService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Component-level error boundary
 * Provides granular error isolation for individual components
 * Shows inline error message without breaking the entire page
 */
export class ComponentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error service
    ErrorService.handleComponentError(error, errorInfo, {
      componentName: this.props.componentName || 'ComponentErrorBoundary',
      action: 'component_render',
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default inline error UI
      return (
        <div className="w-full p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5 text-destructive" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground mb-1">
                Component Error
              </h3>

              <p className="text-sm text-muted-foreground mb-3">
                This component failed to load. You can try refreshing it or continue using the rest
                of the page.
              </p>

              {import.meta.env.DEV && this.state.error && (
                <p className="text-xs font-mono text-destructive mb-3 overflow-auto">
                  {this.state.error.message}
                </p>
              )}

              <button
                onClick={this.handleRetry}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
