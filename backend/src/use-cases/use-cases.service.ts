import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CacheService } from '../common/cache.service';

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
}
