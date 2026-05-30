import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ValidationService } from '../common/validation.service';
import { RateLimitService } from '../common/rate-limit.service';
import { AuditService } from '../audit/audit.service';
import { CacheService } from '../common/cache.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { validateAtLeastOneField } from '../common/validators/require-at-least-one.validator';
import { FetchPreviewResponseDto } from './dto/fetch-preview.dto';
import * as https from 'https';
import * as http from 'http';

@Injectable()
export class ProductsService {
  private readonly CACHE_TTL = {
    LATEST_PRODUCTS: 180000, // 3 minutes
    PRODUCT_DETAIL: 300000,  // 5 minutes
    CATEGORY_PRODUCTS: 240000, // 4 minutes
    USECASE_PRODUCTS: 240000, // 4 minutes
  };

  constructor(
    private prisma: PrismaService,
    private validationService: ValidationService,
    private rateLimitService: RateLimitService,
    private auditService: AuditService,
    private cacheService: CacheService,
    private analyticsService: AnalyticsService,
  ) {}

  async getLatestProducts(pageSize: number = 40, page: number = 1) {
    if (pageSize > 100) {
      throw new BadRequestException('Page size cannot exceed 100');
    }

    const skip = (page - 1) * pageSize;

    // Update cache key to include page
    const cacheKey = `product:latest:${pageSize}:${page}`;
    const cached = this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          status: 'PUBLISHED',
          // Hide products with failed OG fetches from public view
          ogFetchStatus: { not: 'FAILED' },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
        include: {
          categories: {
            include: {
              category: true,
            },
          },
          useCases: {
            include: {
              useCase: true,
            },
          },
        },
      }),
      this.prisma.product.count({
        where: {
          status: 'PUBLISHED',
          ogFetchStatus: { not: 'FAILED' },
        },
      }),
    ]);

    const result = {
      products,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };

    this.cacheService.set(cacheKey, result, this.CACHE_TTL.LATEST_PRODUCTS);
    return result;
  }

  /**
   * Get product by ID with caching and status validation
   * Fixed: HIGH-B2 - Missing NULL checks and status validation
   * - Validates cached product is not null and still PUBLISHED
   * - Invalidates stale cache if product status changed
   */
  async getProductById(productId: string) {
    const cacheKey = `product:single:${productId}`;
    const cached = this.cacheService.get(cacheKey) as any;

    // Validate cached product before returning
    if (cached) {
      // Check if cached value is null or has invalid status
      if (!cached || (cached.status && cached.status !== 'PUBLISHED')) {
        // Invalidate stale cache
        this.cacheService.delete(cacheKey);
      } else {
        // Valid cached product, return it
        return cached;
      }
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        useCases: {
          include: {
            useCase: true,
          },
        },
      },
    });

    // Hide products that are not published OR have failed OG fetches
    if (!product || product.status !== 'PUBLISHED' || product.ogFetchStatus === 'FAILED') {
      return null;
    }

    this.cacheService.set(cacheKey, product, this.CACHE_TTL.PRODUCT_DETAIL);
    return product;
  }

  async getProductByIdAdmin(productId: string) {
    return this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        useCases: {
          include: {
            useCase: true,
          },
        },
      },
    });
  }

  /**
   * Search for products by keyword
   * @param keyword Search query string
   * @param page Page number (1-indexed)
   * @param pageSize Number of results per page
   * @param ip Client IP address for rate limiting
   * @param sessionId Optional session ID for analytics tracking
   * @returns Paginated search results
   */
  async searchProducts(
    keyword: string,
    page: number = 1,
    pageSize: number = 100,
    ip?: string,
    sessionId?: string,
  ) {
    // F2.5.2: Trim keyword BEFORE validation and rate limiting to prevent bypass with padded keywords
    const trimmedKeyword = keyword.trim();

    const rateLimitKey = `search:${trimmedKeyword || 'empty'}:${ip || 'unknown'}`;
    const rateCheck = await this.rateLimitService.checkRateLimit(
      rateLimitKey,
      60 * 1000,
      30,
    );

    if (!rateCheck.allowed) {
      throw new BadRequestException('Search rate limit exceeded. Please slow down.');
    }

    const validation = this.validationService.validateInput('text', trimmedKeyword);
    if (!validation.valid) {
      throw new BadRequestException('Invalid search query');
    }

    if (trimmedKeyword.length > 100) {
      throw new BadRequestException('Search query too long');
    }

    await this.rateLimitService.recordAttempt(rateLimitKey, ip);

    // Track search event for analytics (F2.1.3 - Popular Searches dashboard)
    // Fire-and-forget: don't wait for tracking to complete, to avoid slowing down search
    this.analyticsService
      .trackEvent('search', undefined, { query: trimmedKeyword }, sessionId || '', ip)
      .catch((error) => {
        console.error('[Search] Failed to track search event:', error);
      });

    const skip = (page - 1) * pageSize;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          status: 'PUBLISHED',
          ogFetchStatus: { not: 'FAILED' },
          OR: [
            {
              name: {
                contains: trimmedKeyword,
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: trimmedKeyword,
                mode: 'insensitive',
              },
            },
          ],
        },
        skip,
        take: Math.min(pageSize, 100),
        include: {
          categories: {
            include: {
              category: true,
            },
          },
          useCases: {
            include: {
              useCase: true,
            },
          },
        },
      }),
      this.prisma.product.count({
        where: {
          status: 'PUBLISHED',
          ogFetchStatus: { not: 'FAILED' },
          OR: [
            {
              name: {
                contains: trimmedKeyword,
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: trimmedKeyword,
                mode: 'insensitive',
              },
            },
          ],
        },
      }),
    ]);

    return {
      products,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getProductsByCategory(categoryId: string, page: number = 1, pageSize: number = 100, sortBy: string = 'latest') {
    const cacheKey = `product:category:${categoryId}:${page}:${pageSize}:${sortBy}`;
    const cached = this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const skip = (page - 1) * pageSize;

    // Determine orderBy based on sortBy parameter
    const orderBy = sortBy === 'mostViewed'
      ? { views: 'desc' as const }
      : { createdAt: 'desc' as const };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          status: 'PUBLISHED',
          ogFetchStatus: { not: 'FAILED' },
          categories: {
            some: {
              categoryId,
            },
          },
        },
        skip,
        take: Math.min(pageSize, 100),
        orderBy,
        include: {
          categories: {
            include: {
              category: true,
            },
          },
          useCases: {
            include: {
              useCase: true,
            },
          },
        },
      }),
      this.prisma.product.count({
        where: {
          status: 'PUBLISHED',
          ogFetchStatus: { not: 'FAILED' },
          categories: {
            some: {
              categoryId,
            },
          },
        },
      }),
    ]);

    const result = {
      products,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };

    this.cacheService.set(cacheKey, result, this.CACHE_TTL.CATEGORY_PRODUCTS);
    return result;
  }

  async getProductsByUseCase(useCaseId: string, page: number = 1, pageSize: number = 100, sortBy: string = 'latest') {
    const cacheKey = `product:usecase:${useCaseId}:${page}:${pageSize}:${sortBy}`;
    const cached = this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const skip = (page - 1) * pageSize;

    // Determine orderBy based on sortBy parameter
    const orderBy = sortBy === 'mostViewed'
      ? { views: 'desc' as const }
      : { createdAt: 'desc' as const };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          status: 'PUBLISHED',
          ogFetchStatus: { not: 'FAILED' },
          useCases: {
            some: {
              useCaseId,
            },
          },
        },
        skip,
        take: Math.min(pageSize, 100),
        orderBy,
        include: {
          categories: {
            include: {
              category: true,
            },
          },
          useCases: {
            include: {
              useCase: true,
            },
          },
        },
      }),
      this.prisma.product.count({
        where: {
          status: 'PUBLISHED',
          ogFetchStatus: { not: 'FAILED' },
          useCases: {
            some: {
              useCaseId,
            },
          },
        },
      }),
    ]);

    const result = {
      products,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };

    this.cacheService.set(cacheKey, result, this.CACHE_TTL.USECASE_PRODUCTS);
    return result;
  }

  async getAllProductsForAdmin(adminId: string, limit: number = 100) {
    const maxLimit = Math.min(limit, 1000);

    return this.prisma.product.findMany({
      take: maxLimit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        useCases: {
          include: {
            useCase: true,
          },
        },
      },
    });
  }

  async createProduct(
    adminId: string,
    data: {
      name: string;
      description: string;
      affiliateUrl: string;
      categoryIds: string[];
      useCaseIds: string[];
      images: string[];
      status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
      sourceUrl?: string;
      imageSource?: 'MANUAL_UPLOAD' | 'OG_FETCH';
      descriptionSource?: 'MANUAL_UPLOAD' | 'OG_FETCH';
      ogImageUrl?: string;
      ogFetchStatus?: 'NOT_ATTEMPTED' | 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED';
    },
  ) {
    // Validate adminId exists
    if (!adminId) {
      throw new BadRequestException('Admin ID is required');
    }

    const adminExists = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
      select: { id: true },
    });

    if (!adminExists) {
      throw new BadRequestException('Invalid admin user reference. Please log in again.');
    }

    const nameValidation = this.validationService.validateInput('text', data.name);
    if (!nameValidation.valid) {
      throw new BadRequestException(`Invalid name: ${nameValidation.error}`);
    }

    const descValidation = this.validationService.validateInput('text', data.description);
    if (!descValidation.valid) {
      throw new BadRequestException(`Invalid description: ${descValidation.error}`);
    }

    const urlValidation = this.validationService.validateInput('url', data.affiliateUrl);
    if (!urlValidation.valid) {
      throw new BadRequestException(`Invalid URL: ${urlValidation.error}`);
    }

    if (data.categoryIds.length > 10) {
      throw new BadRequestException('Too many categories');
    }

    if (data.useCaseIds.length > 10) {
      throw new BadRequestException('Too many use cases');
    }

    if (data.images.length > 20) {
      throw new BadRequestException('Too many images');
    }

    try {
      const product = await this.prisma.product.create({
        data: {
          name: data.name.trim(),
          description: data.description.trim(),
          affiliateUrl: data.affiliateUrl.trim(),
          images: data.images,
          status: data.status || 'DRAFT',
          createdById: adminId,
          updatedById: adminId,
          // Smart URL Preview fields
          sourceUrl: data.sourceUrl,
          imageSource: data.imageSource || 'MANUAL_UPLOAD',
          descriptionSource: data.descriptionSource || 'MANUAL_UPLOAD',
          ogImageUrl: data.ogImageUrl,
          ogFetchedAt: data.ogFetchStatus === 'SUCCESS' || data.ogFetchStatus === 'PARTIAL_SUCCESS' ? new Date() : undefined,
          ogFetchStatus: data.ogFetchStatus || 'NOT_ATTEMPTED',
          categories: {
            create: data.categoryIds.map((categoryId) => ({
              categoryId,
            })),
          },
          useCases: {
            create: data.useCaseIds.map((useCaseId) => ({
              useCaseId,
            })),
          },
        },
        include: {
          categories: {
            include: {
              category: true,
            },
          },
          useCases: {
            include: {
              useCase: true,
            },
          },
        },
      });

      await this.auditService.logAction(
        adminId,
        'create_product',
        'product',
        product.id,
        { name: data.name },
      );

      // Invalidate relevant caches with product ID
      this.invalidateProductCaches(product.id, 'product_created');

      return product;
    } catch (error: any) {
      // Handle Prisma foreign key constraint errors
      if (error.code === 'P2003') {
        throw new BadRequestException(
          'Invalid reference: One or more related entities do not exist. Please verify categories and use cases.',
        );
      }
      throw error;
    }
  }

  /**
   * Invalidate product-related caches in a targeted manner
   * Fixed: MEDIUM-B1 - Changed from blanket invalidation to targeted approach
   *
   * @param productId - Specific product ID to invalidate (optional)
   * @param reason - Reason for invalidation (for monitoring)
   */
  private invalidateProductCaches(productId?: string, reason?: string): void {
    if (productId) {
      // Targeted invalidation for specific product
      this.cacheService.delete(`product:single:${productId}`);

      // Log invalidation reason for monitoring
      if (reason && process.env.NODE_ENV !== 'production') {
        console.log(`[Cache Invalidation] Product ${productId}: ${reason}`);
      }
    }

    // Always invalidate latest products list (affected by any product change)
    this.cacheService.deletePattern('product:latest:');

    // Note: Category and use case specific lists are NOT invalidated
    // They will naturally expire via TTL and be refreshed on next request
    // This prevents over-aggressive cache invalidation
  }

  async updateProduct(
    adminId: string,
    productId: string,
    data: {
      name?: string;
      description?: string;
      affiliateUrl?: string;
      categoryIds?: string[];
      useCaseIds?: string[];
      images?: string[];
      status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
      sourceUrl?: string;
      imageSource?: 'MANUAL_UPLOAD' | 'OG_FETCH';
      descriptionSource?: 'MANUAL_UPLOAD' | 'OG_FETCH';
      ogImageUrl?: string;
      ogFetchStatus?: 'NOT_ATTEMPTED' | 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED';
    },
  ) {
    // Validate at least one field is provided
    validateAtLeastOneField(data, [
      'name',
      'description',
      'affiliateUrl',
      'categoryIds',
      'useCaseIds',
      'images',
      'status',
      'sourceUrl',
      'imageSource',
      'descriptionSource',
      'ogImageUrl',
      'ogFetchStatus'
    ]);

    const existingProduct = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    if (data.name !== undefined) {
      const nameValidation = this.validationService.validateInput('text', data.name);
      if (!nameValidation.valid) {
        throw new BadRequestException(`Invalid name: ${nameValidation.error}`);
      }
    }

    if (data.description !== undefined) {
      const descValidation = this.validationService.validateInput('text', data.description);
      if (!descValidation.valid) {
        throw new BadRequestException(`Invalid description: ${descValidation.error}`);
      }
    }

    if (data.affiliateUrl !== undefined) {
      const urlValidation = this.validationService.validateInput('url', data.affiliateUrl);
      if (!urlValidation.valid) {
        throw new BadRequestException(`Invalid URL: ${urlValidation.error}`);
      }
    }

    if (data.categoryIds !== undefined && data.categoryIds.length > 10) {
      throw new BadRequestException('Too many categories');
    }

    if (data.useCaseIds !== undefined && data.useCaseIds.length > 10) {
      throw new BadRequestException('Too many use cases');
    }

    if (data.images !== undefined && data.images.length > 20) {
      throw new BadRequestException('Too many images');
    }

    // Differential update for categories
    if (data.categoryIds !== undefined) {
      // Fetch existing associations
      const existingCategories = await this.prisma.productCategory.findMany({
        where: { productId },
        select: { categoryId: true },
      });

      const existingIds = existingCategories.map((c) => c.categoryId);
      const newIds = data.categoryIds;

      // Calculate differences
      const toAdd = newIds.filter((id) => !existingIds.includes(id));
      const toRemove = existingIds.filter((id) => !newIds.includes(id));

      // Only delete removed associations
      if (toRemove.length > 0) {
        await this.prisma.productCategory.deleteMany({
          where: {
            productId,
            categoryId: { in: toRemove },
          },
        });
      }

      // Only add new associations
      if (toAdd.length > 0) {
        await this.prisma.productCategory.createMany({
          data: toAdd.map((categoryId) => ({
            productId,
            categoryId,
          })),
        });
      }
    }

    // Differential update for useCases
    if (data.useCaseIds !== undefined) {
      // Fetch existing associations
      const existingUseCases = await this.prisma.productUseCase.findMany({
        where: { productId },
        select: { useCaseId: true },
      });

      const existingIds = existingUseCases.map((u) => u.useCaseId);
      const newIds = data.useCaseIds;

      // Calculate differences
      const toAdd = newIds.filter((id) => !existingIds.includes(id));
      const toRemove = existingIds.filter((id) => !newIds.includes(id));

      // Only delete removed associations
      if (toRemove.length > 0) {
        await this.prisma.productUseCase.deleteMany({
          where: {
            productId,
            useCaseId: { in: toRemove },
          },
        });
      }

      // Only add new associations
      if (toAdd.length > 0) {
        await this.prisma.productUseCase.createMany({
          data: toAdd.map((useCaseId) => ({
            productId,
            useCaseId,
          })),
        });
      }
    }

    // Build update data object
    const updateData: any = {
      updatedById: adminId,
    };

    if (data.name !== undefined) {
      updateData.name = data.name.trim();
    }
    if (data.description !== undefined) {
      updateData.description = data.description.trim();
    }
    if (data.affiliateUrl !== undefined) {
      updateData.affiliateUrl = data.affiliateUrl.trim();
    }
    if (data.images !== undefined) {
      updateData.images = data.images;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    // Smart URL Preview fields
    if (data.sourceUrl !== undefined) {
      updateData.sourceUrl = data.sourceUrl;
    }
    if (data.imageSource !== undefined) {
      updateData.imageSource = data.imageSource;
    }
    if (data.descriptionSource !== undefined) {
      updateData.descriptionSource = data.descriptionSource;
    }
    if (data.ogImageUrl !== undefined) {
      updateData.ogImageUrl = data.ogImageUrl;
    }
    if (data.ogFetchStatus !== undefined) {
      updateData.ogFetchStatus = data.ogFetchStatus;
      // Update ogFetchedAt timestamp when status is updated to success/partial success
      if (data.ogFetchStatus === 'SUCCESS' || data.ogFetchStatus === 'PARTIAL_SUCCESS') {
        updateData.ogFetchedAt = new Date();
      }
    }

    // Note: Relations are updated separately above via differential updates
    // No need to include categories/useCases in updateData

    const product = await this.prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        useCases: {
          include: {
            useCase: true,
          },
        },
      },
    });

    await this.auditService.logAction(
      adminId,
      'update_product',
      'product',
      productId,
      {
        name: data.name || existingProduct.name,
        previousName: existingProduct.name,
      },
    );

    // Invalidate relevant caches with product ID
    this.invalidateProductCaches(productId, 'product_updated');

    return product;
  }

  async deleteProduct(adminId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.product.delete({
      where: { id: productId },
    });

    await this.auditService.logAction(
      adminId,
      'delete_product',
      'product',
      productId,
      { name: product.name },
    );

    // Invalidate relevant caches with product ID
    this.invalidateProductCaches(productId, 'product_deleted');
  }

  /**
   * Fetch Open Graph preview data from a vendor product URL
   * Extracts og:title, og:description, og:image with fallbacks
   *
   * @param url - The vendor product URL to fetch OG tags from
   * @returns Preview data with success status and extracted fields
   */
  async fetchPreview(url: string): Promise<FetchPreviewResponseDto> {
    try {
      // Validate URL
      const urlValidation = this.validationService.validateInput('url', url);
      if (!urlValidation.valid) {
        return {
          success: false,
          title: null,
          description: null,
          imageUrl: null,
          failedFields: ['title', 'description', 'image'],
          error: 'Invalid URL format',
        };
      }

      // Fetch HTML with 10 second timeout
      const html = await this.fetchHtmlWithTimeout(url, 10000);

      // Extract OG tags and fallbacks
      const title = this.extractOgTag(html, 'og:title') || this.extractHtmlTitle(html);
      const description = this.extractOgTag(html, 'og:description') || this.extractMetaDescription(html);
      const imageUrl = this.extractOgTag(html, 'og:image') || this.extractFirstImage(html);

      // Determine which fields failed
      const failedFields: string[] = [];
      if (!title) failedFields.push('title');
      if (!description) failedFields.push('description');
      if (!imageUrl) failedFields.push('image');

      const success = failedFields.length === 0;

      return {
        success,
        title,
        description,
        imageUrl,
        failedFields,
      };
    } catch (error: any) {
      // Handle network errors, timeouts, blocked requests
      return {
        success: false,
        title: null,
        description: null,
        imageUrl: null,
        failedFields: ['title', 'description', 'image'],
        error: error.message || 'Failed to fetch URL',
      };
    }
  }

  /**
   * Fetch HTML content from URL with timeout
   */
  private fetchHtmlWithTimeout(url: string, timeoutMs: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol === 'https:' ? https : http;

      const request = protocol.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ProdViewBot/1.0)',
          'Accept': 'text/html,application/xhtml+xml',
        },
        timeout: timeoutMs,
      }, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            this.fetchHtmlWithTimeout(redirectUrl, timeoutMs).then(resolve).catch(reject);
            return;
          }
        }

        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }

        let html = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => { html += chunk; });
        response.on('end', () => resolve(html));
      });

      request.on('error', reject);
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  /**
   * Extract Open Graph meta tag content
   */
  private extractOgTag(html: string, property: string): string | null {
    const regex = new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["'][^>]*>`, 'i');
    const match = html.match(regex);
    if (match && match[1]) {
      return this.decodeHtmlEntities(match[1].trim());
    }

    // Try alternative order: content first, then property
    const altRegex = new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${property}["'][^>]*>`, 'i');
    const altMatch = html.match(altRegex);
    if (altMatch && altMatch[1]) {
      return this.decodeHtmlEntities(altMatch[1].trim());
    }

    return null;
  }

  /**
   * Extract HTML title tag as fallback
   */
  private extractHtmlTitle(html: string): string | null {
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (match && match[1]) {
      return this.decodeHtmlEntities(match[1].trim());
    }
    return null;
  }

  /**
   * Extract meta description as fallback
   */
  private extractMetaDescription(html: string): string | null {
    const regex = /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i;
    const match = html.match(regex);
    if (match && match[1]) {
      return this.decodeHtmlEntities(match[1].trim());
    }

    // Try alternative order
    const altRegex = /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["'][^>]*>/i;
    const altMatch = html.match(altRegex);
    if (altMatch && altMatch[1]) {
      return this.decodeHtmlEntities(altMatch[1].trim());
    }

    return null;
  }

  /**
   * Extract first prominent image as fallback
   */
  private extractFirstImage(html: string): string | null {
    const regex = /<img[^>]*src=["']([^"']+)["'][^>]*>/i;
    const match = html.match(regex);
    if (match && match[1]) {
      const src = match[1].trim();
      // Only return if it looks like a full URL (not relative path)
      if (src.startsWith('http://') || src.startsWith('https://')) {
        return src;
      }
    }
    return null;
  }

  /**
   * Decode common HTML entities
   */
  private decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&apos;': "'",
    };

    return text.replace(/&[^;]+;/g, (entity) => entities[entity] || entity);
  }
}
