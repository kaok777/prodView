import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CacheService } from '../common/cache.service';

@Injectable()
export class CategoriesService {
  private readonly CACHE_TTL = 600000; // 10 minutes

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private cacheService: CacheService,
  ) {}

  async getAllCategories() {
    const cacheKey = 'all_categories';
    const cached = this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const categories = await this.prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        parentCategory: true,
        childCategories: true,
      },
    });

    this.cacheService.set(cacheKey, categories, this.CACHE_TTL);
    return categories;
  }

  async getCategoryById(categoryId: string) {
    return this.prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        parentCategory: true,
        childCategories: true,
      },
    });
  }

  async createCategory(
    adminId: string,
    name: string,
    parentCategoryId?: string,
  ) {
    const category = await this.prisma.category.create({
      data: {
        name,
        parentCategoryId,
      },
    });

    await this.auditService.logAction(
      adminId,
      'create_category',
      'category',
      category.id,
      { name },
    );

    // Invalidate categories cache
    this.cacheService.delete('all_categories');

    return category;
  }
}
