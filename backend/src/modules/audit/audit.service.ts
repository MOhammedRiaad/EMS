import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async log(
    tenantId: string,
    action: string,
    entityType: string,
    entityId: string,
    performedBy: string,
    details?: any,
    ipAddress?: string,
  ) {
    try {
      const log = this.auditRepository.create({
        tenantId,
        action,
        entityType,
        entityId,
        performedBy,
        details,
        ipAddress,
      });
      await this.auditRepository.save(log);
    } catch (error) {
      this.logger.error(
        `Failed to create audit log: ${error.message}`,
        error.stack,
      );
    }
  }

  calculateDiff(oldEntity: any, newEntity: any): any {
    const changes: any = {};
    const allKeys = new Set([
      ...Object.keys(oldEntity || {}),
      ...Object.keys(newEntity || {}),
    ]);

    const ignoredKeys = ['updatedAt', 'version', 'password', 'lastLoginAt'];

    allKeys.forEach((key) => {
      if (ignoredKeys.includes(key)) return;

      const oldVal = oldEntity ? oldEntity[key] : undefined;
      const newVal = newEntity ? newEntity[key] : undefined;

      // Simple equality check (works for primitives and Date objects typically converted to string/number)
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes[key] = {
          old: oldVal,
          new: newVal,
        };
      }
    });

    return { changes };
  }

  async findAll(tenantId: string, limit = 100) {
    return this.auditRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
