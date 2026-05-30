import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  UseGuards,
  Ip,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AnalyticsService } from './analytics.service';
import { AnalyticsCleanupService } from './analytics-cleanup.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Public, CurrentUser, Roles } from '../common/decorators';
import { TrackEventDto, AffiliateClickDto } from './dto/track-event.dto';
import { LimitDto } from '../common/dto/pagination.dto';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly cleanupService: AnalyticsCleanupService,
  ) {}

  @Public()
  @Post('track')
  @Throttle({ default: { limit: 200, ttl: 60000 } })
  trackEvent(
    @Body() trackEventDto: TrackEventDto,
    @Ip() ip: string,
  ) {
    return this.analyticsService.trackEvent(
      trackEventDto.eventType,
      trackEventDto.entityId,
      trackEventDto.metadata,
      trackEventDto.sessionId || '',
      ip,
    );
  }

  @Public()
  @Post('affiliate-click')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  trackAffiliateClick(
    @Body() dto: AffiliateClickDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.analyticsService.trackAffiliateClick(dto.productId, ip, userAgent);
  }

  @Roles('admin')
  @Get('top-products')
  @Throttle({ default: { limit: 50, ttl: 60000 } })
  getTopProducts(
    @CurrentUser() user: any,
    @Query() limitDto: LimitDto,
  ) {
    return this.analyticsService.getTopProducts(
      user.id,
      limitDto.limit || 10,
    );
  }

  @Roles('admin')
  @Get('affiliate-clicks')
  @Throttle({ default: { limit: 50, ttl: 60000 } })
  getAffiliateClicks(
    @CurrentUser() user: any,
    @Query() limitDto: LimitDto,
  ) {
    return this.analyticsService.getAffiliateClicks(
      user.id,
      limitDto.limit || 10,
    );
  }

  @Roles('admin')
  @Get('category-stats')
  @Throttle({ default: { limit: 50, ttl: 60000 } })
  getCategoryStats(@CurrentUser() user: any) {
    return this.analyticsService.getCategoryStats(user.id);
  }

  @Roles('admin')
  @Get('search-stats')
  @Throttle({ default: { limit: 50, ttl: 60000 } })
  getSearchStats(
    @CurrentUser() user: any,
    @Query() limitDto: LimitDto,
  ) {
    return this.analyticsService.getSearchStats(
      user.id,
      limitDto.limit || 20,
    );
  }

  /**
   * GDPR/POPIA Right to Erasure - Delete user's analytics data
   *
   * PUBLIC endpoint allowing users to delete all their analytics data by session ID.
   * Required for GDPR Article 17 (Right to Erasure) and POPIA Section 24 (Data Subject Rights).
   *
   * Privacy Policy reference: Section 7.1 - "Erasure: Request deletion of your data"
   *
   * @param sessionId - The user's analytics session ID (from their browser)
   * @returns Confirmation of deletion with count of deleted events
   *
   * Rate limit: 5 requests per hour (prevent abuse while allowing legitimate requests)
   *
   * @see AUDIT finding L6.4.2 (No mechanism for users to request data deletion)
   * @see src/pages/legal/PrivacyPolicyPage.tsx (Section 7: Your Rights)
   */
  @Public()
  @Delete('delete-my-data')
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 per hour
  async deleteUserData(@Query('sessionId') sessionId: string) {
    if (!sessionId || sessionId.trim() === '') {
      throw new BadRequestException('Session ID is required');
    }

    if (sessionId.length > 100) {
      throw new BadRequestException('Invalid session ID');
    }

    const deleteResult = await this.analyticsService.deleteUserData(sessionId.trim());

    return {
      success: true,
      message: 'Your analytics data has been deleted',
      deletedEvents: deleteResult.count,
      sessionId: sessionId.trim(),
      deletedAt: new Date().toISOString(),
    };
  }

  /**
   * Admin: Trigger manual cleanup of old analytics events
   *
   * ADMIN-ONLY endpoint to manually trigger the 24-month retention cleanup
   * without waiting for the scheduled weekly job.
   *
   * Useful for:
   * - Testing cleanup logic
   * - Immediate compliance after policy change
   * - Emergency cleanup if storage is running out
   *
   * @returns Cleanup result with deleted count and duration
   */
  @Roles('admin')
  @Post('cleanup/manual')
  @Throttle({ default: { limit: 1, ttl: 300000 } }) // 1 per 5 minutes (prevent accidental spam)
  async manualCleanup(@CurrentUser() user: any) {
    return this.cleanupService.manualCleanup();
  }

  /**
   * Admin: Get cleanup statistics
   *
   * ADMIN-ONLY endpoint to view how many events are eligible for deletion
   * based on the 24-month retention policy.
   *
   * Does NOT actually delete anything - just reports statistics.
   *
   * @returns Statistics about events eligible for deletion
   */
  @Roles('admin')
  @Get('cleanup/stats')
  @Throttle({ default: { limit: 50, ttl: 60000 } })
  async getCleanupStats(@CurrentUser() user: any) {
    return this.cleanupService.getCleanupStats();
  }
}
