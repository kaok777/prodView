/**
 * Form Validation Utilities
 *
 * Helper functions and utilities for form validation with react-hook-form
 * Fixes: HIGH-F6 - Form Validation Missing
 */

import { FieldError, FieldErrors } from 'react-hook-form';

/**
 * Get error message from react-hook-form field error
 */
export function getErrorMessage(error?: FieldError): string | undefined {
  if (!error) return undefined;
  return error.message;
}

/**
 * Check if form has any errors
 */
export function hasFormErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Get all error messages from form errors
 */
export function getAllErrorMessages(errors: FieldErrors): string[] {
  const messages: string[] = [];

  const extractMessages = (obj: any, prefix = ''): void => {
    Object.entries(obj).forEach(([key, value]) => {
      const fieldPath = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === 'object') {
        if ('message' in value && typeof value.message === 'string') {
          messages.push(value.message);
        } else if ('type' in value) {
          // Skip nested error structure
          return;
        } else {
          extractMessages(value, fieldPath);
        }
      }
    });
  };

  extractMessages(errors);
  return messages;
}

/**
 * Format field name for display
 * Converts camelCase to Title Case
 */
export function formatFieldName(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Create error message with field name
 */
export function createFieldError(fieldName: string, message: string): string {
  return `${formatFieldName(fieldName)}: ${message}`;
}

/**
 * Validation state helpers
 */
export const validationState = {
  /**
   * Check if field is invalid
   */
  isFieldInvalid: (errors: FieldErrors, fieldName: string): boolean => {
    return !!errors[fieldName];
  },

  /**
   * Get field error message
   */
  getFieldError: (errors: FieldErrors, fieldName: string): string | undefined => {
    const error = errors[fieldName] as FieldError | undefined;
    return getErrorMessage(error);
  },

  /**
   * Check if form is submittable (no errors and not submitting)
   */
  isSubmittable: (errors: FieldErrors, isSubmitting: boolean): boolean => {
    return !hasFormErrors(errors) && !isSubmitting;
  },
};

/**
 * Common validation patterns
 */
export const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/.+/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  alphanumericWithSpaces: /^[a-zA-Z0-9\s]+$/,
};

/**
 * Form submission helpers
 */
export const formHelpers = {
  /**
   * Handle form submission errors
   */
  handleSubmitError: (error: any): string => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  },

  /**
   * Transform form data before submission
   * Trims strings and removes empty values
   */
  cleanFormData: <T extends Record<string, any>>(data: T): Partial<T> => {
    const cleaned: any = {};

    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return; // Skip empty values
      }

      if (typeof value === 'string') {
        cleaned[key] = value.trim();
      } else if (Array.isArray(value)) {
        cleaned[key] = value.filter((item) => item !== undefined && item !== null && item !== '');
      } else {
        cleaned[key] = value;
      }
    });

    return cleaned;
  },

  /**
   * Convert empty strings to null for optional fields
   */
  emptyStringToNull: <T extends Record<string, any>>(data: T): T => {
    const converted: any = { ...data };

    Object.entries(converted).forEach(([key, value]) => {
      if (value === '') {
        converted[key] = null;
      }
    });

    return converted;
  },
};
