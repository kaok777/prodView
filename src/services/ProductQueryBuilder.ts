/**
 * Product Query Builder Service
 * Eliminates code duplication by centralizing product query logic
 * Fixed: HIGH-F2 - Code Duplication in ProductGrid
 */

export interface ProductQueryParams {
  searchQuery?: string | null;
  categoryId?: string | null;
  useCaseId?: string | null;
  sortBy?: 'latest' | 'mostViewed';
  page: number;
  pageSize: number;
}

export interface ProductQueryResult {
  endpoint: string;
  params: Record<string, string | number>;
}

/**
 * ProductQueryBuilder centralizes the logic for building product API queries
 * This eliminates the duplication found in ProductGrid's fetchProducts and handleLoadMore
 */
export class ProductQueryBuilder {
  /**
   * Build a product query based on provided parameters
   * Returns the appropriate endpoint and params for the API call
   */
  static buildQuery(queryParams: ProductQueryParams): ProductQueryResult {
    const { searchQuery, categoryId, useCaseId, sortBy, page, pageSize } = queryParams;

    // Priority: search > category > useCase > latest
    if (searchQuery) {
      return {
        endpoint: '/products/search',
        params: {
          keyword: searchQuery,
          page,
          pageSize,
        },
      };
    }

    if (categoryId) {
      return {
        endpoint: `/products/category/${categoryId}`,
        params: {
          page,
          pageSize,
          ...(sortBy && { sortBy }),
        },
      };
    }

    if (useCaseId) {
      return {
        endpoint: `/products/use-case/${useCaseId}`,
        params: {
          page,
          pageSize,
          ...(sortBy && { sortBy }),
        },
      };
    }

    // Default: latest products
    return {
      endpoint: '/products/latest',
      params: {
        page,
        pageSize,
      },
    };
  }

  /**
   * Helper to check if sortBy should be available for the current query
   */
  static shouldShowSort(queryParams: Pick<ProductQueryParams, 'searchQuery' | 'categoryId' | 'useCaseId'>): boolean {
    return Boolean(queryParams.categoryId || queryParams.useCaseId);
  }

  /**
   * Generate a descriptive title based on query params
   */
  static getQueryTitle(queryParams: Pick<ProductQueryParams, 'searchQuery' | 'categoryId' | 'useCaseId'>): string {
    if (queryParams.searchQuery) {
      return `Search results for "${queryParams.searchQuery}"`;
    }
    if (queryParams.categoryId) {
      return 'Category Products';
    }
    if (queryParams.useCaseId) {
      return 'Use Case Products';
    }
    return 'Latest Products';
  }
}
