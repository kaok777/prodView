import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UseCasesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async getAllUseCases() {
    return this.prisma.useCase.findMany({
      orderBy: {
        name: 'asc',
      },
    });
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

    return useCase;
  }
}
