import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CacheService } from '../common/cache.service';
import { validateAtLeastOneField } from '../common/validators/require-at-least-one.validator';

@Injectable()
export class CategoriesService {
  private readonly CACHE_TTL = 600000; // 10 minutes
  private readonly MAX_CATEGORY_DEPTH = 50; // Maximum allowed category hierarchy depth

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

  async updateCategory(
    adminId: string,
    categoryId: string,
    data: {
      name?: string;
      parentCategoryId?: string;
    },
  ) {
    // Validate at least one field is provided
    validateAtLeastOneField(data, ['name', 'parentCategoryId']);

    const existingCategory = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!existingCategory) {
      throw new NotFoundException('Category not found');
    }

    // Prevent circular references
    if (data.parentCategoryId) {
      if (data.parentCategoryId === categoryId) {
        throw new BadRequestException('A category cannot be its own parent');
      }

      // Check if the parent exists
      const parent = await this.prisma.category.findUnique({
        where: { id: data.parentCategoryId },
      });

      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }

      // Check for circular reference (parent's parent chain)
      // Fixed: HIGH-B3 - Added MAX_DEPTH limit to prevent infinite loops
      let currentParent = parent;
      let depth = 0;

      while (currentParent.parentCategoryId) {
        depth++;

        // Prevent infinite loops and excessively deep hierarchies
        // Fixed: LOW-B5 - Error Message Leakage (removed internal field references)
        if (depth > this.MAX_CATEGORY_DEPTH) {
          throw new BadRequestException(
            `Category hierarchy depth cannot exceed ${this.MAX_CATEGORY_DEPTH} levels`,
          );
        }

        if (currentParent.parentCategoryId === categoryId) {
          throw new BadRequestException(
            'Cannot create circular category hierarchy',
          );
        }

        const nextParent = await this.prisma.category.findUnique({
          where: { id: currentParent.parentCategoryId },
        });

        if (!nextParent) break;
        currentParent = nextParent;
      }
    }

    const category = await this.prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.parentCategoryId !== undefined && {
          parentCategoryId: data.parentCategoryId,
        }),
      },
      include: {
        parentCategory: true,
        childCategories: true,
      },
    });

    await this.auditService.logAction(
      adminId,
      'update_category',
      'category',
      categoryId,
      { name: data.name || existingCategory.name },
    );

    // Invalidate categories cache
    this.cacheService.delete('all_categories');

    return category;
  }

  async deleteCategory(adminId: string, categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        childCategories: true,
        products: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check if category has child categories
    if (category.childCategories && category.childCategories.length > 0) {
      throw new ConflictException(
        'Cannot delete category with child categories. Delete or reassign child categories first.',
      );
    }

    // Check if category is used by products
    if (category.products && category.products.length > 0) {
      throw new ConflictException(
        `Cannot delete category. It is used by ${category.products.length} product(s). Remove category from products first.`,
      );
    }

    await this.prisma.category.delete({
      where: { id: categoryId },
    });

    await this.auditService.logAction(
      adminId,
      'delete_category',
      'category',
      categoryId,
      { name: category.name },
    );

    // Invalidate categories cache
    this.cacheService.delete('all_categories');
  }
}
