/**
 * Shared type definitions for the ProdView application
 * These types are used across both frontend and backend to ensure type safety
 */

/**
 * Product status enum
 */
export enum ProductStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Image source enum (for smart URL preview feature)
 */
export enum ImageSource {
  MANUAL_UPLOAD = 'MANUAL_UPLOAD',
  OG_FETCH = 'OG_FETCH',
}

/**
 * Content source enum (for smart URL preview feature)
 */
export enum ContentSource {
  MANUAL_UPLOAD = 'MANUAL_UPLOAD',
  OG_FETCH = 'OG_FETCH',
}

/**
 * OG fetch status enum
 */
export enum OgFetchStatus {
  NOT_ATTEMPTED = 'NOT_ATTEMPTED',
  SUCCESS = 'SUCCESS',
  PARTIAL_SUCCESS = 'PARTIAL_SUCCESS',
  FAILED = 'FAILED',
}

/**
 * Base Product type (matches database schema)
 */
export interface Product {
  id: string;
  name: string;
  description: string;
  affiliateUrl: string;
  images: string[];
  views: number;
  status: ProductStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdById: string;
  updatedById: string;
  // Smart URL Preview fields
  sourceUrl?: string | null;
  imageSource?: ImageSource;
  descriptionSource?: ContentSource;
  ogImageUrl?: string | null;
  ogFetchedAt?: Date | string | null;
  ogFetchStatus?: OgFetchStatus;
}

/**
 * Base Category type
 */
export interface Category {
  id: string;
  name: string;
  parentCategoryId: string | null;
  createdAt: Date | string;
}

/**
 * Base UseCase type
 */
export interface UseCase {
  id: string;
  name: string;
  createdAt: Date | string;
}

/**
 * Admin User type
 */
export interface AdminUser {
  id: string;
  email: string;
  role: string;
  createdAt: Date | string;
  lastLoginAt: Date | string | null;
}

/**
 * Product with relation data (for detail views)
 */
export interface ProductWithRelations extends Product {
  categories: Array<{
    productId: string;
    categoryId: string;
    category: Category;
  }>;
  useCases: Array<{
    productId: string;
    useCaseId: string;
    useCase: UseCase;
  }>;
  views?: number; // Optional for analytics
  clicks?: number; // Optional for analytics
}

/**
 * Category with hierarchy
 */
export interface CategoryWithRelations extends Category {
  parentCategory: Category | null;
  childCategories: Category[];
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  products?: T[]; // For products endpoint
  data?: T[]; // Generic data
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Analytics event types
 */
export enum AnalyticsEventType {
  PRODUCT_VIEW = 'product_view',
  AFFILIATE_CLICK = 'affiliate_click',
  CATEGORY_CLICK = 'category_click',
  USE_CASE_CLICK = 'use_case_click',
  SEARCH = 'search',
  PAGE_VIEW = 'page_view',
}

/**
 * Analytics event
 */
export interface AnalyticsEvent {
  id: string;
  eventType: AnalyticsEventType | string;
  entityId: string | null;
  metadata: Record<string, any> | null;
  timestamp: Date | string;
  sessionId: string;
}

/**
 * Audit log entry
 */
export interface AuditLog {
  id: string;
  adminUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: Date | string;
  metadata: Record<string, any> | null;
}

/**
 * Product with analytics (for admin dashboard)
 */
export interface ProductWithAnalytics extends Product {
  views?: number;
  clicks?: number;
}

/**
 * Category with analytics
 */
export interface CategoryWithAnalytics extends Category {
  clicks: number;
}

/**
 * Search query stat
 */
export interface SearchQueryStat {
  query: string;
  count: number;
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}

/**
 * Login response
 */
export interface LoginResponse {
  adminId: string;
  email: string;
  role: string;
}

/**
 * Fetch preview response (for smart URL preview feature)
 */
export interface FetchPreviewResponse {
  success: boolean;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  failedFields: string[];
  error?: string;
}

/**
 * Type guard to check if value is a Product
 */
export function isProduct(value: any): value is Product {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.description === 'string' &&
    typeof value.affiliateUrl === 'string' &&
    Array.isArray(value.images) &&
    typeof value.status === 'string'
  );
}

/**
 * Type guard to check if value is a ProductWithRelations
 */
export function isProductWithRelations(value: any): value is ProductWithRelations {
  return (
    isProduct(value) &&
    Array.isArray(value.categories) &&
    Array.isArray(value.useCases)
  );
}

/**
 * Type guard to check if value is a Category
 */
export function isCategory(value: any): value is Category {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    (value.parentCategoryId === null || typeof value.parentCategoryId === 'string')
  );
}

/**
 * Type guard to check if value is a UseCase
 */
export function isUseCase(value: any): value is UseCase {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    typeof value.name === 'string'
  );
}

/**
 * Type guard for paginated response
 */
export function isPaginatedResponse<T>(value: any): value is PaginatedResponse<T> {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.total === 'number' &&
    typeof value.page === 'number' &&
    typeof value.pageSize === 'number' &&
    typeof value.totalPages === 'number' &&
    (Array.isArray(value.products) || Array.isArray(value.data))
  );
}
