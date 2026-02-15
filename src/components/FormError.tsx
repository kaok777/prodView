/**
 * FormError Component
 *
 * Reusable component for displaying inline form validation errors
 * Fixes: HIGH-F6 - Form Validation Missing
 */

import { AlertCircle } from 'lucide-react';

export interface FormErrorProps {
  /**
   * Error message to display
   */
  message?: string;

  /**
   * Whether to show the error (for conditional rendering)
   */
  show?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * FormError displays inline validation errors for form fields
 *
 * @example
 * <FormError message={errors.name?.message} />
 *
 * @example
 * <FormError
 *   message="This field is required"
 *   show={isSubmitted && !value}
 * />
 */
export function FormError({ message, show = true, className = '' }: FormErrorProps) {
  if (!message || !show) return null;

  return (
    <div
      className={`flex items-start gap-2 mt-1.5 text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200 ${className}`}
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

/**
 * FormErrorList displays multiple validation errors
 *
 * @example
 * <FormErrorList errors={['Name is required', 'Email is invalid']} />
 */
export interface FormErrorListProps {
  errors: string[];
  className?: string;
}

export function FormErrorList({ errors, className = '' }: FormErrorListProps) {
  if (!errors || errors.length === 0) return null;

  return (
    <div
      className={`bg-destructive/10 border border-destructive/20 rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-200 ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-destructive mb-2">
            Please fix the following errors:
          </h3>
          <ul className="space-y-1 text-sm text-destructive/90">
            {errors.map((error, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-destructive/60 mt-0.5">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * FormFieldError is a specialized error component for form fields
 * with better accessibility and styling
 */
export interface FormFieldErrorProps {
  /**
   * Field name (for aria-describedby)
   */
  fieldName: string;

  /**
   * Error message
   */
  message?: string;
}

export function FormFieldError({ fieldName, message }: FormFieldErrorProps) {
  if (!message) return null;

  return (
    <div
      id={`${fieldName}-error`}
      className="flex items-start gap-2 mt-1.5 text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200"
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}
