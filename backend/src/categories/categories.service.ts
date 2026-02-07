import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async getAllCategories() {
    return this.prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        parentCategory: true,
        childCategories: true,
      },
    });
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

    return category;
  }
}
