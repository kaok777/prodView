import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService with query logging and performance monitoring
 * Fixed: P3.1.5 - Added query logging for development and slow query detection
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';

    super({
      log: isProduction
        ? [
            // Production: Only log warnings and errors
            { emit: 'event', level: 'warn' },
            { emit: 'event', level: 'error' },
          ]
        : [
            // Development: Log all queries for debugging
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'info' },
            { emit: 'event', level: 'warn' },
            { emit: 'event', level: 'error' },
          ],
    });

    // Listen to query events for performance monitoring
    // @ts-ignore - Prisma event types are not fully typed
    this.$on('query', (e: any) => {
      // In production: Only log slow queries (>1000ms)
      // In development: Log all queries with duration
      const durationMs = e.duration;
      const isSlowQuery = durationMs > 1000;

      if (isProduction) {
        // Production: Only log slow queries
        if (isSlowQuery) {
          console.warn(
            `[Slow Query] ${durationMs}ms - ${e.query.substring(0, 100)}...`,
          );
        }
      } else {
        // Development: Log all queries with color coding
        const color = isSlowQuery ? '\x1b[31m' : durationMs > 100 ? '\x1b[33m' : '\x1b[32m';
        const reset = '\x1b[0m';
        console.log(
          `${color}[Prisma Query] ${durationMs}ms${reset} - ${e.query.substring(0, 150)}`,
        );
      }
    });

    // Log warnings and errors in all environments
    // @ts-ignore
    this.$on('warn', (e: any) => {
      console.warn(`[Prisma Warning]`, e);
    });

    // @ts-ignore
    this.$on('error', (e: any) => {
      console.error(`[Prisma Error]`, e);
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
