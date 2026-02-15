/**
 * API Response Validation
 * Provides runtime type checking for API responses to catch shape mismatches
 * Fixed: MEDIUM-F7 - API Response Shape Assumptions
 */

import {
  isProduct,
  isProductWithRelations,
  isCategory,
  isUseCase,
  isPaginatedResponse,
  type Product,
  type ProductWithRelations,
  type Category,
  UseCase,
  type PaginatedResponse,
} from '../types';

/**
 * Validate and parse a product response
 * @param data - Raw API response data
 * @returns Validated Product or null
 */
export function validateProduct(data: unknown): Product | null {
  if (!data) return null;

  if (isProduct(data)) {
    return data;
  }

  console.warn('[API Validation] Invalid product shape:', data);
  return null;
}

/**
 * Validate and parse a product with relations response
 * @param data - Raw API response data
 * @returns Validated ProductWithRelations or null
 */
export function validateProductWithRelations(data: unknown): ProductWithRelations | null {
  if (!data) return null;

  if (isProductWithRelations(data)) {
    return data;
  }

  console.warn('[API Validation] Invalid product with relations shape:', data);
  return null;
}

/**
 * Validate and parse a category response
 * @param data - Raw API response data
 * @returns Validated Category or null
 */
export function validateCategory(data: unknown): Category | null {
  if (!data) return null;

  if (isCategory(data)) {
    return data;
  }

  console.warn('[API Validation] Invalid category shape:', data);
  return null;
}

/**
 * Validate and parse a use case response
 * @param data - Raw API response data
 * @returns Validated UseCase or null
 */
export function validateUseCase(data: unknown): UseCase | null {
  if (!data) return null;

  if (isUseCase(data)) {
    return data;
  }

  console.warn('[API Validation] Invalid use case shape:', data);
  return null;
}

/**
 * Validate and parse an array of products
 * @param data - Raw API response data
 * @returns Array of validated Products (filters out invalid ones)
 */
export function validateProductArray(data: unknown): Product[] {
  if (!Array.isArray(data)) {
    console.warn('[API Validation] Expected array, got:', typeof data);
    return [];
  }

  const validProducts: Product[] = [];
  for (const item of data) {
    const validated = validateProduct(item);
    if (validated) {
      validProducts.push(validated);
    }
  }

  if (validProducts.length !== data.length) {
    console.warn(
      `[API Validation] Filtered ${data.length - validProducts.length} invalid products`
    );
  }

  return validProducts;
}

/**
 * Validate and parse an array of categories
 * @param data - Raw API response data
 * @returns Array of validated Categories (filters out invalid ones)
 */
export function validateCategoryArray(data: unknown): Category[] {
  if (!Array.isArray(data)) {
    console.warn('[API Validation] Expected array, got:', typeof data);
    return [];
  }

  const validCategories: Category[] = [];
  for (const item of data) {
    const validated = validateCategory(item);
    if (validated) {
      validCategories.push(validated);
    }
  }

  if (validCategories.length !== data.length) {
    console.warn(
      `[API Validation] Filtered ${data.length - validCategories.length} invalid categories`
    );
  }

  return validCategories;
}

/**
 * Validate and parse an array of use cases
 * @param data - Raw API response data
 * @returns Array of validated UseCases (filters out invalid ones)
 */
export function validateUseCaseArray(data: unknown): UseCase[] {
  if (!Array.isArray(data)) {
    console.warn('[API Validation] Expected array, got:', typeof data);
    return [];
  }

  const validUseCases: UseCase[] = [];
  for (const item of data) {
    const validated = validateUseCase(item);
    if (validated) {
      validUseCases.push(validated);
    }
  }

  if (validUseCases.length !== data.length) {
    console.warn(
      `[API Validation] Filtered ${data.length - validUseCases.length} invalid use cases`
    );
  }

  return validUseCases;
}

/**
 * Validate paginated response
 * @param data - Raw API response data
 * @returns Validated PaginatedResponse or null
 */
export function validatePaginatedResponse<T>(
  data: unknown,
  itemValidator: (item: unknown) => T | null
): PaginatedResponse<T> | null {
  if (!isPaginatedResponse(data)) {
    console.warn('[API Validation] Invalid paginated response shape:', data);
    return null;
  }

  // Validate individual items
  const items = data.products || data.data || [];
  const validatedItems: T[] = [];

  for (const item of items) {
    const validated = itemValidator(item);
    if (validated) {
      validatedItems.push(validated);
    }
  }

  return {
    ...data,
    products: data.products ? validatedItems : undefined,
    data: data.data ? validatedItems : undefined,
  };
}

/**
 * Safe API call wrapper with validation
 * @param apiCall - Async function that makes the API call
 * @param validator - Validation function to apply to response
 * @param fallback - Fallback value if validation fails
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<any>,
  validator: (data: unknown) => T | null,
  fallback: T
): Promise<T> {
  try {
    const response = await apiCall();
    const validated = validator(response.data);

    if (validated === null) {
      console.warn('[API] Validation failed, using fallback');
      return fallback;
    }

    return validated;
  } catch (error) {
    console.error('[API] Call failed:', error);
    return fallback;
  }
}
