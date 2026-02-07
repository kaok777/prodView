import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../common/prisma.service';
import { RateLimitService } from '../common/rate-limit.service';
import { ValidationService } from '../common/validation.service';

@Module({
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    PrismaService,
    RateLimitService,
    ValidationService,
  ],
})
export class AnalyticsModule {}
