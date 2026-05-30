/**
 * Metadata Type Definitions
 * Fixed: CQ4.4.1 - Define TypeScript interfaces for metadata schemas
 *
 * These interfaces define the structure of JSON metadata stored in the database.
 * Use these instead of 'any' or 'unknown' for type-safe metadata handling.
 */

/**
 * Analytics Event Metadata
 * Stored in analytics_events.metadata
 */

export interface SearchMetadata {
  searchTerm: string;
  resultsCount: number;
  filters?: {
    categories?: string[];
    useCases?: string[];
  };
  timestamp: string;
}

export interface AffiliateClickMetadata {
  productId: string;
  productName: string;
  affiliateUrl: string;
  clickSource: 'card' | 'details' | 'search' | 'featured';
  timestamp: string;
}

export interface PageViewMetadata {
  path: string;
  referrer?: string;
  userAgent?: string;
  timestamp: string;
}

export interface ProductViewMetadata {
  productId: string;
  productName: string;
  categories: string[];
  useCases: string[];
  viewDuration?: number; // milliseconds
  timestamp: string;
}

/**
 * Union type for all analytics event metadata
 */
export type AnalyticsEventMetadata =
  | SearchMetadata
  | AffiliateClickMetadata
  | PageViewMetadata
  | ProductViewMetadata
  | Record<string, unknown>; // Fallback for unknown metadata

/**
 * Audit Log Metadata
 * Stored in audit_logs.metadata
 */

export interface ProductAuditMetadata {
  productId: string;
  productName?: string;
  action: 'create' | 'update' | 'delete' | 'publish' | 'unpublish';
  changes?: {
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }[];
  timestamp: string;
}

export interface CategoryAuditMetadata {
  categoryId: string;
  categoryName?: string;
  action: 'create' | 'update' | 'delete';
  changes?: {
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }[];
  timestamp: string;
}

export interface UseCaseAuditMetadata {
  useCaseId: string;
  useCaseName?: string;
  action: 'create' | 'update' | 'delete';
  changes?: {
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }[];
  timestamp: string;
}

export interface AuthAuditMetadata {
  adminId?: string;
  email?: string;
  action: 'login' | 'logout' | 'failed_login' | 'password_change';
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

/**
 * Union type for all audit log metadata
 */
export type AuditLogMetadata =
  | ProductAuditMetadata
  | CategoryAuditMetadata
  | UseCaseAuditMetadata
  | AuthAuditMetadata
  | Record<string, unknown>; // Fallback for unknown metadata

/**
 * Type guard to check if metadata is SearchMetadata
 */
export function isSearchMetadata(metadata: unknown): metadata is SearchMetadata {
  return (
    typeof metadata === 'object' &&
    metadata !== null &&
    'searchTerm' in metadata &&
    'resultsCount' in metadata
  );
}

/**
 * Type guard to check if metadata is AffiliateClickMetadata
 */
export function isAffiliateClickMetadata(
  metadata: unknown,
): metadata is AffiliateClickMetadata {
  return (
    typeof metadata === 'object' &&
    metadata !== null &&
    'productId' in metadata &&
    'affiliateUrl' in metadata &&
    'clickSource' in metadata
  );
}

/**
 * Type guard to check if metadata is ProductAuditMetadata
 */
export function isProductAuditMetadata(
  metadata: unknown,
): metadata is ProductAuditMetadata {
  return (
    typeof metadata === 'object' &&
    metadata !== null &&
    'productId' in metadata &&
    'action' in metadata
  );
}

/**
 * Safely cast Prisma JSON metadata to typed metadata
 * Returns null if the cast is invalid
 *
 * @example
 * const metadata = safelyTypedMetadata<SearchMetadata>(event.metadata, isSearchMetadata);
 * if (metadata) {
 *   console.log(metadata.searchTerm); // Type-safe!
 * }
 */
export function safelyTypedMetadata<T>(
  metadata: unknown,
  typeGuard: (metadata: unknown) => metadata is T,
): T | null {
  if (typeGuard(metadata)) {
    return metadata;
  }
  return null;
}

/**
 * Utility to create type-safe metadata objects
 */
export const MetadataFactory = {
  search: (data: SearchMetadata): SearchMetadata => ({
    searchTerm: data.searchTerm,
    resultsCount: data.resultsCount,
    filters: data.filters,
    timestamp: data.timestamp || new Date().toISOString(),
  }),

  affiliateClick: (data: AffiliateClickMetadata): AffiliateClickMetadata => ({
    productId: data.productId,
    productName: data.productName,
    affiliateUrl: data.affiliateUrl,
    clickSource: data.clickSource,
    timestamp: data.timestamp || new Date().toISOString(),
  }),

  pageView: (data: PageViewMetadata): PageViewMetadata => ({
    path: data.path,
    referrer: data.referrer,
    userAgent: data.userAgent,
    timestamp: data.timestamp || new Date().toISOString(),
  }),

  productView: (data: ProductViewMetadata): ProductViewMetadata => ({
    productId: data.productId,
    productName: data.productName,
    categories: data.categories,
    useCases: data.useCases,
    viewDuration: data.viewDuration,
    timestamp: data.timestamp || new Date().toISOString(),
  }),

  productAudit: (data: ProductAuditMetadata): ProductAuditMetadata => ({
    productId: data.productId,
    productName: data.productName,
    action: data.action,
    changes: data.changes,
    timestamp: data.timestamp || new Date().toISOString(),
  }),

  authAudit: (data: AuthAuditMetadata): AuthAuditMetadata => ({
    adminId: data.adminId,
    email: data.email,
    action: data.action,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    timestamp: data.timestamp || new Date().toISOString(),
  }),
};
