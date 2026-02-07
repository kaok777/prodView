import { Module } from '@nestjs/common';
import { UseCasesController } from './use-cases.controller';
import { UseCasesService } from './use-cases.service';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CacheService } from '../common/cache.service';

@Module({
  controllers: [UseCasesController],
  providers: [UseCasesService, PrismaService, AuditService, CacheService],
})
export class UseCasesModule {}
