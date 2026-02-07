import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, PrismaService, AuditService],
})
export class CategoriesModule {}
