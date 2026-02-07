import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class RateLimitService {
  constructor(private prisma: PrismaService) {}

  async checkRateLimit(
    key: string,
    windowMs: number,
    maxAttempts: number,
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMs);

    const attempts = await this.prisma.rateLimit.count({
      where: {
        key,
        timestamp: {
          gte: windowStart,
        },
      },
    });

    return {
      allowed: attempts < maxAttempts,
      remaining: Math.max(0, maxAttempts - attempts),
      resetTime: windowStart.getTime() + windowMs,
    };
  }

  async recordAttempt(key: string, ip?: string, userAgent?: string): Promise<void> {
    await this.prisma.rateLimit.create({
      data: {
        key,
        ip,
        userAgent,
      },
    });

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await this.prisma.rateLimit.deleteMany({
      where: {
        timestamp: {
          lt: cutoff,
        },
      },
    });
  }
}
