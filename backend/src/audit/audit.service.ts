import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async logAction(
    adminUserId: string | null,
    action: string,
    entityType: string,
    entityId: string,
    metadata?: any,
  ): Promise<void> {
    if (action.length > 100) {
      throw new Error('Action name too long');
    }

    if (entityType.length > 50) {
      throw new Error('Entity type too long');
    }

    if (entityId.length > 100) {
      throw new Error('Entity ID too long');
    }

    let sanitizedMetadata = metadata;
    if (metadata) {
      const metadataStr = JSON.stringify(metadata);
      if (metadataStr.length > 2000) {
        sanitizedMetadata = {
          error: 'Metadata too large',
          originalSize: metadataStr.length,
        };
      }
    }

    await this.prisma.auditLog.create({
      data: {
        adminUserId,
        action,
        entityType,
        entityId,
        metadata: sanitizedMetadata,
      },
    });
  }

  async getAuditLogs(adminId: string, limit: number = 50): Promise<any[]> {
    const maxLimit = Math.min(limit, 500);

    return this.prisma.auditLog.findMany({
      take: maxLimit,
      orderBy: {
        timestamp: 'desc',
      },
      include: {
        adminUser: {
          select: {
            email: true,
          },
        },
      },
    });
  }

  async getSecurityEvents(adminId: string, limit: number = 100): Promise<any[]> {
    const maxLimit = Math.min(limit, 500);
    const securityActions = [
      'login_success',
      'login_failed_user_not_found',
      'login_failed_invalid_password',
      'login_rate_limited',
      'login_error',
      'password_reset_requested',
      'password_reset_completed',
    ];

    return this.prisma.auditLog.findMany({
      where: {
        action: {
          in: securityActions,
        },
      },
      take: maxLimit,
      orderBy: {
        timestamp: 'desc',
      },
      include: {
        adminUser: {
          select: {
            email: true,
          },
        },
      },
    });
  }

  async cleanupOldLogs(daysToKeep: number): Promise<{ deletedCount: number }> {
    const cutoffTime = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffTime,
        },
      },
    });

    return { deletedCount: result.count };
  }
}
