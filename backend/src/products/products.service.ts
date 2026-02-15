import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ValidationService } from '../common/validation.service';
import { RateLimitService } from '../common/rate-limit.service';
import { AuditService } from '../audit/audit.service';
import { CacheService } from '../common/cache.service';
import { validateAtLeastOneField } from '../common/validators/require-at-least-one.validator';

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

    if (!product || product.status !== 'PUBLISHED') {
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

  async searchProducts(keyword: string, page: number = 1, pageSize: number = 100, ip?: string) {
    const rateLimitKey = `search:${ip || 'unknown'}`;
    const rateCheck = await this.rateLimitService.checkRateLimit(
      rateLimitKey,
      60 * 1000,
      30,
    );

    if (!rateCheck.allowed) {
      throw new BadRequestException('Search rate limit exceeded. Please slow down.');
    }

    const validation = this.validationService.validateInput('text', keyword);
    if (!validation.valid) {
      throw new BadRequestException('Invalid search query');
    }

    if (keyword.length > 100) {
      throw new BadRequestException('Search query too long');
    }

    await this.rateLimitService.recordAttempt(rateLimitKey, ip);

    const trimmedKeyword = keyword.trim();
    const skip = (page - 1) * pageSize;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          status: 'PUBLISHED',
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
      'status'
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
}
