import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../auth/entities/user.entity';
import { Client } from '../clients/entities/client.entity';
import { Coach } from '../coaches/entities/coach.entity';
import { Studio } from '../studios/entities/studio.entity';
import { UsageTrackingService } from '../owner/services/usage-tracking.service';

export interface ImportClientRow {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  dateOfBirth?: string;
  notes?: string;
  studioId?: string;
  studioName?: string;
}

export interface ImportCoachRow {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  bio?: string;
  specializations?: string; // comma-separated
}

export interface ImportResult {
  totalRows: number;
  successCount: number;
  failedCount: number;
  errors: { row: number; error: string }[];
}

export interface ImportValidation {
  canImport: boolean;
  requestedCount: number;
  currentCount: number;
  limit: number;
  availableSlots: number;
  wouldExceedBy: number;
  importableCount: number; // How many can be imported within limits
  message: string;
}

@Injectable()
export class ImportService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly usageTrackingService: UsageTrackingService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(Coach)
    private readonly coachRepo: Repository<Coach>,
  ) { }

  /**
   * Validate client import against package limits
   */
  async validateClientImport(
    tenantId: string,
    rowCount: number,
  ): Promise<ImportValidation> {
    const snapshot = await this.usageTrackingService.getUsageSnapshot(tenantId);
    const { current, limit } = snapshot.clients;

    // If limit is -1, it means unlimited
    if (limit === -1) {
      return {
        canImport: true,
        requestedCount: rowCount,
        currentCount: current,
        limit: -1,
        availableSlots: -1,
        wouldExceedBy: 0,
        importableCount: rowCount,
        message: 'Unlimited clients allowed. All rows can be imported.',
      };
    }

    const availableSlots = Math.max(0, limit - current);
    const wouldExceedBy = Math.max(0, rowCount - availableSlots);
    const importableCount = Math.min(rowCount, availableSlots);
    const canImport = availableSlots > 0;

    let message: string;
    if (wouldExceedBy > 0) {
      message = `Import would exceed client limit. Current: ${current}/${limit}. Requested: ${rowCount}. Only ${importableCount} can be imported. Upgrade your plan for more clients.`;
    } else {
      message = `All ${rowCount} clients can be imported. Current: ${current}/${limit}.`;
    }

    return {
      canImport,
      requestedCount: rowCount,
      currentCount: current,
      limit,
      availableSlots,
      wouldExceedBy,
      importableCount,
      message,
    };
  }

  /**
   * Validate coach import against package limits
   */
  async validateCoachImport(
    tenantId: string,
    rowCount: number,
  ): Promise<ImportValidation> {
    const snapshot = await this.usageTrackingService.getUsageSnapshot(tenantId);
    const { current, limit } = snapshot.coaches;

    if (limit === -1) {
      return {
        canImport: true,
        requestedCount: rowCount,
        currentCount: current,
        limit: -1,
        availableSlots: -1,
        wouldExceedBy: 0,
        importableCount: rowCount,
        message: 'Unlimited coaches allowed. All rows can be imported.',
      };
    }

    const availableSlots = Math.max(0, limit - current);
    const wouldExceedBy = Math.max(0, rowCount - availableSlots);
    const importableCount = Math.min(rowCount, availableSlots);
    const canImport = availableSlots > 0;

    let message: string;
    if (wouldExceedBy > 0) {
      message = `Import would exceed coach limit. Current: ${current}/${limit}. Requested: ${rowCount}. Only ${importableCount} can be imported. Upgrade your plan for more coaches.`;
    } else {
      message = `All ${rowCount} coaches can be imported. Current: ${current}/${limit}.`;
    }

    return {
      canImport,
      requestedCount: rowCount,
      currentCount: current,
      limit,
      availableSlots,
      wouldExceedBy,
      importableCount,
      message,
    };
  }

  /**
   * Generate a random password for imported users
   */
  private generateRandomPassword(length = 12): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Import clients from parsed CSV/Excel data
   */
  async importClients(
    tenantId: string,
    rows: ImportClientRow[],
  ): Promise<ImportResult> {
    const result: ImportResult = {
      totalRows: rows.length,
      successCount: 0,
      failedCount: 0,
      errors: [],
    };

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Fetch first active studio if needed
      let defaultStudioId: string | undefined;
      const needsStudio = rows.some(r => !r.studioId && !r.studioName);

      if (needsStudio) {
        // We need to inject StudiosService or repository to fetch this. 
        // For now, let's assume valid studioId is passed or handle it via a new query
        const studio = await queryRunner.manager.findOne(Studio, {
          where: { tenantId, active: true },
          order: { createdAt: 'ASC' } // Stable selection
        });
        if (studio) {
          defaultStudioId = studio.id;
        }
      }

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // +2 for 1-indexed and header row

        try {
          // Validate required fields
          if (!row.firstName || !row.lastName) {
            throw new Error(
              'Missing required fields: firstName, lastName',
            );
          }

          // Handle missing email with dummy
          let email = row.email;
          if (!email) {
            const timestamp = new Date().getTime();
            const random = Math.floor(Math.random() * 10000);
            email = `dummy_${timestamp}_${random}@example.com`;
          }

          // Check if email already exists
          const existingUser = await queryRunner.manager.findOne(User, {
            where: { email: email.toLowerCase(), tenantId },
          });

          if (existingUser) {
            if (row.email) {
              // If provided email exists, error out
              throw new Error(`Email ${email} already exists`);
            } else {
              // If dummy email exists (unlikely), generate another one
              const timestamp = new Date().getTime();
              const random = Math.floor(Math.random() * 10000);
              email = `dummy_${timestamp}_${random}_retry@example.com`;
            }
          }

          // Generate password and hash
          const tempPassword = this.generateRandomPassword();
          const passwordHash = await bcrypt.hash(tempPassword, 10);

          // Create user
          const user = queryRunner.manager.create(User, {
            tenantId,
            email: email.toLowerCase(),
            passwordHash,
            firstName: row.firstName,
            lastName: row.lastName,
            phone: row.phone || null,
            gender: row.gender || 'prefer_not_to_say',
            role: 'client',
            mustChangePassword: true, // Force password change on first login
            active: true,
          });
          const savedUser = await queryRunner.manager.save(User, user);

          // Determine Studio ID
          let studioId = row.studioId || defaultStudioId;

          if (!studioId && row.studioName) {
            const studio = await queryRunner.manager.findOne(Studio, {
              where: { name: row.studioName, tenantId }
            });
            if (studio) studioId = studio.id;
          }

          if (!studioId) {
            // Fallback to default if still not found
            studioId = defaultStudioId;
          }

          // Create client profile
          const client = queryRunner.manager.create(Client, {
            userId: savedUser.id,
            firstName: row.firstName,
            lastName: row.lastName,
            email: email.toLowerCase(),
            phone: row.phone || null,
            dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : null,
            notes: row.notes || null,
            status: 'active',
            studioId: studioId || null
          });
          // Set tenantId separately since it's from base entity
          (client as any).tenantId = tenantId;
          await queryRunner.manager.save(Client, client);

          result.successCount++;
        } catch (error: any) {
          result.failedCount++;
          result.errors.push({ row: rowNum, error: error.message });
        }
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    return result;
  }

  /**
   * Import coaches from parsed CSV/Excel data
   */
  async importCoaches(
    tenantId: string,
    rows: ImportCoachRow[],
  ): Promise<ImportResult> {
    const result: ImportResult = {
      totalRows: rows.length,
      successCount: 0,
      failedCount: 0,
      errors: [],
    };

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;

        try {
          if (!row.email || !row.firstName || !row.lastName) {
            throw new Error(
              'Missing required fields: email, firstName, lastName',
            );
          }

          const existingUser = await queryRunner.manager.findOne(User, {
            where: { email: row.email.toLowerCase(), tenantId },
          });

          if (existingUser) {
            throw new Error(`Email ${row.email} already exists`);
          }

          const tempPassword = this.generateRandomPassword();
          const passwordHash = await bcrypt.hash(tempPassword, 10);

          // Create user with coach role
          const user = queryRunner.manager.create(User, {
            tenantId,
            email: row.email.toLowerCase(),
            passwordHash,
            firstName: row.firstName,
            lastName: row.lastName,
            phone: row.phone || null,
            role: 'coach',
            mustChangePassword: true,
            active: true,
          });
          const savedUser = await queryRunner.manager.save(User, user);

          // Parse specializations
          const specializations = row.specializations
            ? row.specializations.split(',').map((s) => s.trim())
            : [];

          // Create coach profile
          const coach = queryRunner.manager.create(Coach, {
            tenantId,
            userId: savedUser.id,
            bio: row.bio || null,
            specializations,
            isActive: true,
          });
          await queryRunner.manager.save(Coach, coach);

          result.successCount++;
        } catch (error: any) {
          result.failedCount++;
          result.errors.push({ row: rowNum, error: error.message });
        }
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    return result;
  }

  /**
   * Parse CSV string to array of objects
   */
  parseCSV<T>(csvContent: string): T[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      throw new BadRequestException(
        'CSV must have at least a header row and one data row',
      );
    }

    const headers = lines[0]
      .split(',')
      .map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows: T[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i]
        .split(',')
        .map((v) => v.trim().replace(/^"|"$/g, ''));
      const row: any = {};

      headers.forEach((header, index) => {
        // Convert header to camelCase
        const key = header.replace(/_([a-z])/g, (_, letter) =>
          letter.toUpperCase(),
        );
        row[key] = values[index] || undefined;
      });

      rows.push(row as T);
    }

    return rows;
  }
}
