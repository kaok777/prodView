import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma.service';

/**
 * AnalyticsCleanupService
 *
 * Enforces data retention policy by automatically deleting analytics events
 * older than 24 months, as disclosed in the Privacy Policy.
 *
 * GDPR/POPIA Compliance:
 * - Privacy Policy states: "Analytics Data: 24 months"
 * - Legal requirement: Must honor stated retention periods
 * - Automated deletion ensures compliance without manual intervention
 *
 * @see src/pages/legal/PrivacyPolicyPage.tsx (Section 6: Data Retention)
 * @see AUDIT finding L6.4.1 (Analytics data retention period not enforced)
 */
@Injectable()
export class AnalyticsCleanupService {
  private readonly logger = new Logger(AnalyticsCleanupService.name);

  /**
   * 24 months in milliseconds
   * Privacy Policy retention period: 24 months from collection
   */
  private readonly RETENTION_PERIOD_MS = 24 * 30 * 24 * 60 * 60 * 1000; // 24 months

  constructor(private prisma: PrismaService) {}

  /**
   * Scheduled cleanup job
   *
   * Runs weekly on Sunday at 02:00 AM (server time)
   * Deletes analytics events older than 24 months
   *
   * Schedule: Every Sunday at 2 AM (low-traffic time)
   * Why weekly: Balance between timely deletion and system load
   */
  @Cron(CronExpression.EVERY_WEEK, {
    name: 'analytics-cleanup',
    timeZone: 'UTC',
  })
  async cleanupOldAnalyticsEvents() {
    const startTime = Date.now();
    this.logger.log('[Analytics Cleanup] Starting scheduled cleanup of old analytics events...');

    try {
      const retentionCutoffDate = new Date(Date.now() - this.RETENTION_PERIOD_MS);

      this.logger.log(`[Analytics Cleanup] Deleting events older than: ${retentionCutoffDate.toISOString()}`);

      // Delete events older than 24 months
      const deleteResult = await this.prisma.analyticsEvent.deleteMany({
        where: {
          timestamp: {
            lt: retentionCutoffDate,
          },
        },
      });

      const duration = Date.now() - startTime;

      this.logger.log(
        `[Analytics Cleanup] ✅ Completed successfully. ` +
        `Deleted ${deleteResult.count} events. ` +
        `Duration: ${duration}ms`
      );

      return {
        success: true,
        deletedCount: deleteResult.count,
        cutoffDate: retentionCutoffDate,
        durationMs: duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `[Analytics Cleanup] ❌ Failed after ${duration}ms: ${errorMessage}`,
        errorStack
      );

      // Don't throw - log error and continue (scheduled job should not crash app)
      return {
        success: false,
        error: errorMessage,
        durationMs: duration,
      };
    }
  }

  /**
   * Manual cleanup trigger
   *
   * Allows admin to manually trigger cleanup without waiting for scheduled job.
   * Useful for:
   * - Testing cleanup logic
   * - Immediate compliance after policy change
   * - Emergency cleanup if storage is running out
   *
   * @returns Cleanup result with deleted count
   */
  async manualCleanup() {
    this.logger.log('[Analytics Cleanup] Manual cleanup triggered by admin');
    return this.cleanupOldAnalyticsEvents();
  }

  /**
   * Get cleanup statistics
   *
   * Returns information about how many events would be deleted
   * without actually deleting them. Useful for monitoring and reporting.
   *
   * @returns Statistics about events eligible for deletion
   */
  async getCleanupStats() {
    const retentionCutoffDate = new Date(Date.now() - this.RETENTION_PERIOD_MS);

    const eligibleForDeletion = await this.prisma.analyticsEvent.count({
      where: {
        timestamp: {
          lt: retentionCutoffDate,
        },
      },
    });

    const totalEvents = await this.prisma.analyticsEvent.count();

    return {
      totalEvents,
      eligibleForDeletion,
      retentionCutoffDate,
      retentionPeriodMonths: 24,
    };
  }
}
