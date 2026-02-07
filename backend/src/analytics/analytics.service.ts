import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RateLimitService } from '../common/rate-limit.service';
import { ValidationService } from '../common/validation.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private rateLimitService: RateLimitService,
    private validationService: ValidationService,
  ) {}

  async trackEvent(
    eventType: string,
    entityId: string | undefined,
    metadata: any,
    sessionId: string,
    ip?: string,
  ) {
    const rateLimitKey = `analytics:${ip || 'unknown'}`;
    const rateCheck = await this.rateLimitService.checkRateLimit(
      rateLimitKey,
      60 * 1000,
      100,
    );

    if (!rateCheck.allowed) {
      return;
    }

    const allowedEvents = [
      'product_view',
      'affiliate_click',
      'category_click',
      'use_case_click',
      'search',
      'page_view',
    ];

    if (!allowedEvents.includes(eventType)) {
      throw new BadRequestException('Invalid event type');
    }

    let sanitizedMetadata = metadata;
    if (metadata) {
      const metadataStr = JSON.stringify(metadata);
      if (metadataStr.length > 1000) {
        sanitizedMetadata = { error: 'Metadata too large' };
      }

      const validation = this.validationService.validateInput('text', metadataStr);
      if (!validation.valid) {
        sanitizedMetadata = { error: 'Invalid metadata content' };
      }
    }

    await this.rateLimitService.recordAttempt(rateLimitKey, ip);

    await this.prisma.analyticsEvent.create({
      data: {
        eventType,
        entityId,
        metadata: sanitizedMetadata,
        sessionId,
      },
    });
  }

  async trackAffiliateClick(
    productId: string,
    ip?: string,
    userAgent?: string,
  ) {
    const rateLimitKey = `affiliate:${ip || 'unknown'}`;
    const rateCheck = await this.rateLimitService.checkRateLimit(
      rateLimitKey,
      60 * 1000,
      10,
    );

    if (!rateCheck.allowed) {
      throw new BadRequestException('Too many affiliate clicks. Please slow down.');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.status !== 'PUBLISHED') {
      throw new NotFoundException('Product not found');
    }

    await this.rateLimitService.recordAttempt(rateLimitKey, ip, userAgent);

    await this.prisma.analyticsEvent.create({
      data: {
        eventType: 'affiliate_click',
        entityId: productId,
        metadata: {
          url: product.affiliateUrl,
          timestamp: new Date().toISOString(),
        },
        sessionId: Math.random().toString(36).substring(7),
      },
    });

    return { redirectUrl: product.affiliateUrl };
  }

  async getTopProducts(adminId: string, limit: number = 10) {
    const maxLimit = Math.min(limit, 50);

    const productViews = await this.prisma.analyticsEvent.findMany({
      where: {
        eventType: 'product_view',
      },
    });

    const viewCounts: Record<string, number> = {};
    for (const event of productViews) {
      if (event.entityId) {
        viewCounts[event.entityId] = (viewCounts[event.entityId] || 0) + 1;
      }
    }

    const topProductIds = Object.entries(viewCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxLimit)
      .map(([id, count]) => ({ productId: id, views: count }));

    const products = await Promise.all(
      topProductIds.map(async ({ productId, views }) => {
        const product = await this.prisma.product.findUnique({
          where: { id: productId },
        });
        return product ? { ...product, views } : null;
      }),
    );

    return products.filter(Boolean);
  }

  async getAffiliateClicks(adminId: string, limit: number = 10) {
    const maxLimit = Math.min(limit, 50);

    const affiliateClicks = await this.prisma.analyticsEvent.findMany({
      where: {
        eventType: 'affiliate_click',
      },
    });

    const clickCounts: Record<string, number> = {};
    for (const event of affiliateClicks) {
      if (event.entityId) {
        clickCounts[event.entityId] = (clickCounts[event.entityId] || 0) + 1;
      }
    }

    const topClicks = Object.entries(clickCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxLimit)
      .map(([id, count]) => ({ productId: id, clicks: count }));

    const products = await Promise.all(
      topClicks.map(async ({ productId, clicks }) => {
        const product = await this.prisma.product.findUnique({
          where: { id: productId },
        });
        return product ? { ...product, clicks } : null;
      }),
    );

    return products.filter(Boolean);
  }

  async getCategoryStats(adminId: string) {
    const categoryClicks = await this.prisma.analyticsEvent.findMany({
      where: {
        eventType: 'category_click',
      },
    });

    const clickCounts: Record<string, number> = {};
    for (const event of categoryClicks) {
      if (event.entityId) {
        clickCounts[event.entityId] = (clickCounts[event.entityId] || 0) + 1;
      }
    }

    const categoryStats = await Promise.all(
      Object.entries(clickCounts).map(async ([categoryId, clicks]) => {
        const category = await this.prisma.category.findUnique({
          where: { id: categoryId },
        });
        return category ? { ...category, clicks } : null;
      }),
    );

    return categoryStats
      .filter((stat): stat is NonNullable<typeof stat> => stat !== null)
      .sort((a, b) => b.clicks - a.clicks);
  }

  async getSearchStats(adminId: string, limit: number = 20) {
    const maxLimit = Math.min(limit, 100);

    const searchEvents = await this.prisma.analyticsEvent.findMany({
      where: {
        eventType: 'search',
      },
    });

    const searchCounts: Record<string, number> = {};
    for (const event of searchEvents) {
      const metadata = event.metadata as any;
      const query = metadata?.query;
      if (query && typeof query === 'string' && query.length <= 100) {
        const normalizedQuery = query.toLowerCase().trim();
        searchCounts[normalizedQuery] = (searchCounts[normalizedQuery] || 0) + 1;
      }
    }

    return Object.entries(searchCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxLimit)
      .map(([query, count]) => ({ query, count }));
  }
}
