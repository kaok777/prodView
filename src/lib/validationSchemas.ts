/**
 * Form Validation Schemas
 *
 * Centralized validation schemas using Zod for all admin forms
 * Fixes: HIGH-F6 - Form Validation Missing
 * Helps: MEDIUM-B3 - Missing Input Validation in Update Endpoints (client-side prevention)
 */

import { z } from 'zod';

/**
 * Product Form Validation Schema
 * Validates product creation and update forms
 */
export const productSchema = z.object({
  name: z
    .string()
    .min(1, 'Product name is required')
    .min(3, 'Product name must be at least 3 characters')
    .max(200, 'Product name must not exceed 200 characters')
    .trim(),

  description: z
    .string()
    .min(1, 'Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must not exceed 5000 characters')
    .trim(),

  affiliateUrl: z
    .string()
    .min(1, 'Affiliate URL is required')
    .url('Must be a valid URL')
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      'URL must start with http:// or https://'
    ),

  categoryIds: z
    .array(z.string().uuid('Invalid category ID'))
    .min(1, 'At least one category is required')
    .max(10, 'Cannot assign more than 10 categories'),

  useCaseIds: z
    .array(z.string().uuid('Invalid use case ID'))
    .min(1, 'At least one use case is required')
    .max(10, 'Cannot assign more than 10 use cases'),

  images: z
    .array(z.string())
    .min(1, 'At least one image is required')
    .max(10, 'Cannot upload more than 10 images'),

  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'], {
    errorMap: () => ({ message: 'Invalid product status' }),
  }),

  // Smart URL Preview fields (optional)
  sourceUrl: z
    .string()
    .url('Source URL must be a valid URL')
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      'URL must start with http:// or https://'
    )
    .optional()
    .or(z.literal('')),

  imageSource: z.enum(['MANUAL_UPLOAD', 'OG_FETCH']).optional(),

  descriptionSource: z.enum(['MANUAL_UPLOAD', 'OG_FETCH']).optional(),

  ogImageUrl: z
    .string()
    .url('OG image URL must be a valid URL')
    .optional()
    .or(z.literal('')),

  ogFetchStatus: z.enum(['NOT_ATTEMPTED', 'SUCCESS', 'PARTIAL_SUCCESS', 'FAILED']).optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;

/**
 * Product Update Schema
 * More lenient schema for updates - allows partial data
 * Ensures at least one field is being updated (fixes MEDIUM-B3)
 */
export const productUpdateSchema = productSchema.partial().refine(
  (data) => {
    // At least one field must be provided for update
    return Object.keys(data).length > 0 && Object.values(data).some((value) => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.trim().length > 0;
      return value !== undefined && value !== null;
    });
  },
  { message: 'At least one field must be provided for update' }
);

/**
 * Category Form Validation Schema
 * Validates category creation and update forms
 */
export const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .min(2, 'Category name must be at least 2 characters')
    .max(100, 'Category name must not exceed 100 characters')
    .trim()
    .refine(
      (name) => !/^\s|\s$/.test(name),
      'Category name cannot start or end with spaces'
    ),

  parentCategoryId: z
    .string()
    .uuid('Invalid parent category ID')
    .nullable()
    .optional()
    .or(z.literal('')),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

/**
 * Category Update Schema
 * Ensures at least one field is being updated
 */
export const categoryUpdateSchema = categorySchema.partial().refine(
  (data) => {
    return Object.keys(data).length > 0 && Object.values(data).some((value) => {
      if (typeof value === 'string') return value.trim().length > 0;
      return value !== undefined && value !== null;
    });
  },
  { message: 'At least one field must be provided for update' }
);

/**
 * Use Case Form Validation Schema
 * Validates use case creation and update forms
 */
export const useCaseSchema = z.object({
  name: z
    .string()
    .min(1, 'Use case name is required')
    .min(2, 'Use case name must be at least 2 characters')
    .max(100, 'Use case name must not exceed 100 characters')
    .trim()
    .refine(
      (name) => !/^\s|\s$/.test(name),
      'Use case name cannot start or end with spaces'
    ),
});

export type UseCaseFormData = z.infer<typeof useCaseSchema>;

/**
 * Use Case Update Schema
 * Ensures at least one field is being updated
 */
export const useCaseUpdateSchema = useCaseSchema.partial().refine(
  (data) => {
    return Object.keys(data).length > 0 && Object.values(data).some((value) => {
      if (typeof value === 'string') return value.trim().length > 0;
      return value !== undefined && value !== null;
    });
  },
  { message: 'At least one field must be provided for update' }
);

/**
 * Login Form Validation Schema
 * Validates admin login form
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Must be a valid email address')
    .max(255, 'Email must not exceed 255 characters')
    .toLowerCase()
    .trim(),

  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Common validation helpers
 */
export const validationHelpers = {
  /**
   * Check if a string is a valid UUID
   */
  isValidUUID: (value: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  },

  /**
   * Check if a string is a valid URL
   */
  isValidURL: (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Sanitize string input (remove leading/trailing spaces, normalize)
   */
  sanitizeString: (value: string): string => {
    return value.trim().replace(/\s+/g, ' ');
  },
};
