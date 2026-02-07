import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { PrismaService } from '../common/prisma.service';
import { ValidationService } from '../common/validation.service';
import { RateLimitService } from '../common/rate-limit.service';
import { AuditService } from '../audit/audit.service';
import { CacheService } from '../common/cache.service';

@Module({
  controllers: [ProductsController],
  providers: [
    ProductsService,
    PrismaService,
    ValidationService,
    RateLimitService,
    AuditService,
    CacheService,
  ],
})
export class ProductsModule {}
