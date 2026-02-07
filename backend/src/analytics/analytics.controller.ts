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
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Public, CurrentUser, Roles } from '../common/decorators';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Public()
  @Post('track')
  trackEvent(
    @Body() trackEventDto: {
      eventType: string;
      entityId?: string;
      metadata?: any;
      sessionId: string;
    },
    @Ip() ip: string,
  ) {
    return this.analyticsService.trackEvent(
      trackEventDto.eventType,
      trackEventDto.entityId,
      trackEventDto.metadata,
      trackEventDto.sessionId,
      ip,
    );
  }

  @Public()
  @Post('affiliate-click')
  trackAffiliateClick(
    @Body() dto: { productId: string },
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.analyticsService.trackAffiliateClick(dto.productId, ip, userAgent);
  }

  @Roles('admin')
  @Get('top-products')
  getTopProducts(
    @CurrentUser() user: any,
    @Query('limit') limit: string,
  ) {
    return this.analyticsService.getTopProducts(
      user.id,
      parseInt(limit) || 10,
    );
  }

  @Roles('admin')
  @Get('affiliate-clicks')
  getAffiliateClicks(
    @CurrentUser() user: any,
    @Query('limit') limit: string,
  ) {
    return this.analyticsService.getAffiliateClicks(
      user.id,
      parseInt(limit) || 10,
    );
  }

  @Roles('admin')
  @Get('category-stats')
  getCategoryStats(@CurrentUser() user: any) {
    return this.analyticsService.getCategoryStats(user.id);
  }

  @Roles('admin')
  @Get('search-stats')
  getSearchStats(
    @CurrentUser() user: any,
    @Query('limit') limit: string,
  ) {
    return this.analyticsService.getSearchStats(
      user.id,
      parseInt(limit) || 20,
    );
  }
}
