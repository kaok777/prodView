import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ValidationService } from '../common/validation.service';
import { RateLimitService } from '../common/rate-limit.service';
import { AuditService } from '../audit/audit.service';
import { CacheService } from '../common/cache.service';

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

  async getLatestProducts(limit: number) {
    if (limit > 100) {
      throw new BadRequestException('Limit cannot exceed 100');
    }

    const cacheKey = `product:latest:${limit}`;
    const cached = this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const products = await this.prisma.product.findMany({
      where: {
        status: 'PUBLISHED',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
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

    this.cacheService.set(cacheKey, products, this.CACHE_TTL.LATEST_PRODUCTS);
    return products;
  }

  async getProductById(productId: string) {
    const cacheKey = `product:single:${productId}`;
    const cached = this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
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

      // Invalidate relevant caches
      this.invalidateProductCaches();

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
   * Invalidate all product-related caches
   * Called after any product mutation (create, update, delete)
   */
  private invalidateProductCaches(): void {
    this.cacheService.deletePattern('product:');
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

    // Only update relations if provided
    if (data.categoryIds !== undefined) {
      await this.prisma.productCategory.deleteMany({
        where: { productId },
      });
    }

    if (data.useCaseIds !== undefined) {
      await this.prisma.productUseCase.deleteMany({
        where: { productId },
      });
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

    if (data.categoryIds !== undefined) {
      updateData.categories = {
        create: data.categoryIds.map((categoryId) => ({
          categoryId,
        })),
      };
    }

    if (data.useCaseIds !== undefined) {
      updateData.useCases = {
        create: data.useCaseIds.map((useCaseId) => ({
          useCaseId,
        })),
      };
    }

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

    // Invalidate relevant caches
    this.invalidateProductCaches();

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

    // Invalidate relevant caches
    this.invalidateProductCaches();
  }
}
