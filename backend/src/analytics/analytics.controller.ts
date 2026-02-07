import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Ip,
  Headers,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Public, CurrentUser, Roles } from '../common/decorators';
import { TrackEventDto, AffiliateClickDto } from './dto/track-event.dto';
import { LimitDto } from '../common/dto/pagination.dto';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

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
}
