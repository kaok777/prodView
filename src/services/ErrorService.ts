import { toast } from 'sonner';

/**
 * Error severity levels for categorization and handling
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Error context for detailed logging and debugging
 */
export interface ErrorContext {
  componentName?: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

/**
 * Centralized error handling service
 * Provides consistent error logging, user notification, and monitoring
 */
class ErrorServiceClass {
  private errorLog: Array<{ error: Error; context: ErrorContext; severity: ErrorSeverity }> = [];
  private readonly MAX_LOG_SIZE = 100;

  /**
   * Log an error with context and severity
   * @param error - The error object
   * @param context - Additional context about where/how the error occurred
   * @param severity - Error severity level
   */
  logError(
    error: Error | unknown,
    context: Partial<ErrorContext> = {},
    severity: ErrorSeverity = ErrorSeverity.ERROR
  ): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));

    const fullContext: ErrorContext = {
      ...context,
      timestamp: new Date(),
    };

    // Add to in-memory log
    this.errorLog.push({ error: errorObj, context: fullContext, severity });

    // Keep log size manageable
    if (this.errorLog.length > this.MAX_LOG_SIZE) {
      this.errorLog.shift();
    }

    // Console logging for development
    if (import.meta.env.DEV) {
      console.group(`🔴 Error [${severity}]`);
      console.error('Error:', errorObj);
      console.log('Context:', fullContext);
      console.groupEnd();
    }

    // Send to monitoring service in production
    if (import.meta.env.PROD) {
      this.reportToMonitoring(errorObj, fullContext, severity);
    }
  }

  /**
   * Notify user of an error with appropriate message
   * @param error - The error object
   * @param userMessage - Optional custom message to show user (defaults to generic message)
   * @param options - Toast notification options
   */
  notifyUser(
    error: Error | unknown,
    userMessage?: string,
    options: { duration?: number; action?: { label: string; onClick: () => void } } = {}
  ): void {
    const message =
      userMessage ||
      (error instanceof Error && error.message) ||
      'An unexpected error occurred. Please try again.';

    toast.error(message, {
      duration: options.duration || 5000,
      action: options.action,
    });
  }

  /**
   * Handle API errors with appropriate user messaging
   * @param error - The API error
   * @param context - Error context
   * @param customMessage - Optional custom message
   */
  handleApiError(
    error: any,
    context: Partial<ErrorContext> = {},
    customMessage?: string
  ): void {
    const severity = this.getApiErrorSeverity(error);
    this.logError(error, context, severity);

    let userMessage = customMessage;
    if (!userMessage) {
      if (error.response?.status === 404) {
        userMessage = 'The requested resource was not found.';
      } else if (error.response?.status === 403) {
        userMessage = 'You do not have permission to perform this action.';
      } else if (error.response?.status === 401) {
        userMessage = 'Your session has expired. Please log in again.';
      } else if (error.response?.status >= 500) {
        userMessage = 'A server error occurred. Please try again later.';
      } else if (error.message?.includes('Network Error')) {
        userMessage = 'Network error. Please check your internet connection.';
      } else {
        userMessage = error.response?.data?.message || 'An error occurred. Please try again.';
      }
    }

    this.notifyUser(error, userMessage);
  }

  /**
   * Handle component errors (typically from error boundaries)
   * @param error - The error object
   * @param errorInfo - React error info with component stack
   * @param context - Additional context
   */
  handleComponentError(
    error: Error,
    errorInfo: React.ErrorInfo,
    context: Partial<ErrorContext> = {}
  ): void {
    this.logError(
      error,
      {
        ...context,
        metadata: {
          componentStack: errorInfo.componentStack,
        },
      },
      ErrorSeverity.CRITICAL
    );

    // Don't show toast in error boundary (boundary will show UI)
    // Just log for monitoring
  }

  /**
   * Get recent errors for debugging
   * @param count - Number of recent errors to retrieve
   */
  getRecentErrors(count: number = 10): Array<{
    error: Error;
    context: ErrorContext;
    severity: ErrorSeverity;
  }> {
    return this.errorLog.slice(-count);
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Determine error severity from API error
   * @param error - The API error
   */
  private getApiErrorSeverity(error: any): ErrorSeverity {
    if (error.response?.status === 401 || error.response?.status === 403) {
      return ErrorSeverity.WARNING;
    }
    if (error.response?.status >= 500) {
      return ErrorSeverity.CRITICAL;
    }
    if (error.message?.includes('Network Error')) {
      return ErrorSeverity.ERROR;
    }
    return ErrorSeverity.ERROR;
  }

  /**
   * Report error to monitoring service (Sentry, Datadog, etc.)
   * @param error - The error object
   * @param context - Error context
   * @param severity - Error severity
   */
  private reportToMonitoring(
    error: Error,
    context: ErrorContext,
    severity: ErrorSeverity
  ): void {
    // TODO: Integrate with monitoring service (Sentry, Datadog, etc.)
    // Example:
    // Sentry.captureException(error, {
    //   level: severity,
    //   contexts: { custom: context },
    // });

    // For now, just log to console in production
    console.error('[Monitoring] Error:', error, 'Context:', context, 'Severity:', severity);
  }
}

// Export singleton instance
export const ErrorService = new ErrorServiceClass();

// Export for testing
export { ErrorServiceClass };
