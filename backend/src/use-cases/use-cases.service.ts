import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CacheService } from '../common/cache.service';
import { validateAtLeastOneField } from '../common/validators/require-at-least-one.validator';

@Injectable()
export class UseCasesService {
  private readonly CACHE_TTL = 600000; // 10 minutes

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private cacheService: CacheService,
  ) {}

  async getAllUseCases() {
    const cacheKey = 'all_use_cases';
    const cached = this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const useCases = await this.prisma.useCase.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    this.cacheService.set(cacheKey, useCases, this.CACHE_TTL);
    return useCases;
  }

  async getUseCaseById(useCaseId: string) {
    return this.prisma.useCase.findUnique({
      where: { id: useCaseId },
    });
  }

  async createUseCase(adminId: string, name: string) {
    const useCase = await this.prisma.useCase.create({
      data: {
        name,
      },
    });

    await this.auditService.logAction(
      adminId,
      'create_use_case',
      'useCase',
      useCase.id,
      { name },
    );

    // Invalidate use cases cache
    this.cacheService.delete('all_use_cases');

    return useCase;
  }

  async updateUseCase(
    adminId: string,
    useCaseId: string,
    data: {
      name?: string;
    },
  ) {
    // Validate at least one field is provided
    validateAtLeastOneField(data, ['name']);

    const existingUseCase = await this.prisma.useCase.findUnique({
      where: { id: useCaseId },
    });

    if (!existingUseCase) {
      throw new NotFoundException('Use case not found');
    }

    const useCase = await this.prisma.useCase.update({
      where: { id: useCaseId },
      data: {
        ...(data.name && { name: data.name }),
      },
    });

    await this.auditService.logAction(
      adminId,
      'update_use_case',
      'useCase',
      useCaseId,
      { name: data.name || existingUseCase.name },
    );

    // Invalidate use cases cache
    this.cacheService.delete('all_use_cases');

    return useCase;
  }

  async deleteUseCase(adminId: string, useCaseId: string) {
    const useCase = await this.prisma.useCase.findUnique({
      where: { id: useCaseId },
      include: {
        products: true,
      },
    });

    if (!useCase) {
      throw new NotFoundException('Use case not found');
    }

    // Check if use case is used by products
    if (useCase.products && useCase.products.length > 0) {
      throw new ConflictException(
        `Cannot delete use case. It is used by ${useCase.products.length} product(s). Remove use case from products first.`,
      );
    }

    await this.prisma.useCase.delete({
      where: { id: useCaseId },
    });

    await this.auditService.logAction(
      adminId,
      'delete_use_case',
      'useCase',
      useCaseId,
      { name: useCase.name },
    );

    // Invalidate use cases cache
    this.cacheService.delete('all_use_cases');
  }
}
