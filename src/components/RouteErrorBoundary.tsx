import React, { Component, ReactNode } from 'react';
import { useNavigate, useLocation, NavigateFunction, Location } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { ErrorService } from '../services/ErrorService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  routeName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Route-level error boundary component
 * Catches errors in route components and shows fallback UI
 * Allows navigation to home or retry without full page reload
 */
class RouteErrorBoundaryClass extends Component<Props & { navigate: NavigateFunction; location: Location }, State> {
  constructor(props: Props & { navigate: NavigateFunction; location: Location }) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error service
    ErrorService.handleComponentError(error, errorInfo, {
      componentName: this.props.routeName || 'RouteErrorBoundary',
      action: 'component_render',
      metadata: {
        pathname: this.props.location.pathname,
      },
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  componentDidUpdate(prevProps: Props & { navigate: NavigateFunction; location: Location }) {
    // Reset error state when route changes
    if (this.state.hasError && prevProps.location.pathname !== this.props.location.pathname) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    this.props.navigate('/');
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
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-destructive/10 p-3 rounded-full">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-center mb-2 text-foreground">
              Something went wrong
            </h2>

            <p className="text-center text-muted-foreground mb-6">
              We encountered an error while loading this page. Don't worry, your data is safe.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-4 bg-muted rounded-md">
                <p className="font-mono text-sm text-destructive mb-2">
                  {this.state.error.message}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                      Component Stack
                    </summary>
                    <pre className="mt-2 text-xs overflow-auto max-h-40 text-muted-foreground">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-4">
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper component to inject React Router hooks into class component
 */
export function RouteErrorBoundary(props: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  return <RouteErrorBoundaryClass {...props} navigate={navigate} location={location} />;
}
