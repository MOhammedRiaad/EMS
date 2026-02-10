import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSettings } from '../entities/system-settings.entity';
import { OwnerAuditService } from './owner-audit.service';

@Injectable()
export class SystemConfigService {
  private readonly logger = new Logger(SystemConfigService.name);
  private cache: Map<string, any> = new Map();

  constructor(
    @InjectRepository(SystemSettings)
    private settingsRepo: Repository<SystemSettings>,
    private readonly auditService: OwnerAuditService,
  ) {}

  async get<T>(key: string, defaultValue?: T): Promise<T> {
    if (this.cache.has(key)) {
      return this.cache.get(key) as T;
    }

    const setting = await this.settingsRepo.findOne({ where: { key } });
    if (setting) {
      try {
        const value = JSON.parse(setting.value);
        this.cache.set(key, value);
        return value as T;
      } catch (error) {
        this.logger.error(`Failed to parse setting ${key}`, error);
      }
    }

    return defaultValue as T;
  }

  async set(
    key: string,
    value: any,
    category: string = 'system',
    ownerId: string,
    ip: string,
    description?: string,
  ): Promise<SystemSettings> {
    const stringValue = JSON.stringify(value);
    const oldValue = await this.get(key);

    let setting = await this.settingsRepo.findOne({ where: { key } });
    if (!setting) {
      setting = this.settingsRepo.create({ key });
    }

    setting.value = stringValue;
    setting.category = category;
    if (description) setting.description = description;

    await this.settingsRepo.save(setting);
    this.cache.set(key, value); // Update cache

    await this.auditService.logAction(
      ownerId,
      'UPDATE_SYSTEM_SETTING',
      { key, oldValue, newValue: value, category },
      undefined,
      ip,
    );

    return setting;
  }

  async getAllByCategory(category: string): Promise<Record<string, any>> {
    const settings = await this.settingsRepo.find({ where: { category } });
    const result: Record<string, any> = {};

    for (const s of settings) {
      try {
        result[s.key] = JSON.parse(s.value);
      } catch {
        result[s.key] = s.value;
      }
    }
    return result;
  }
}
