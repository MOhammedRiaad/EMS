import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  service: string;
  version: string;
  uptime: number;
  checks: {
    database: ComponentHealth;
    redis: ComponentHealth;
    storage: ComponentHealth;
  };
}

export interface ComponentHealth {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  message?: string;
  details?: Record<string, any>;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();
  private s3Client: S3Client;
  private bucket: string;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {
    // Initialize S3 client for MinIO health checks
    this.bucket = this.configService.get('MINIO_BUCKET') || 'ems-assets';
    const endpoint =
      this.configService.get('MINIO_ENDPOINT') || 'http://minio:9000';
    const region = this.configService.get('MINIO_REGION') || 'us-east-1';
    const accessKeyId =
      this.configService.get('MINIO_ROOT_USER') || 'minio_user';
    const secretAccessKey =
      this.configService.get('MINIO_ROOT_PASSWORD') || 'minio_secret';

    this.s3Client = new S3Client({
      endpoint,
      region,
      forcePathStyle: true,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  /**
   * Perform a full health check of all system components
   */
  async checkHealth(): Promise<HealthCheckResult> {
    const [database, redis, storage] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkStorage(),
    ]);

    const checks = { database, redis, storage };

    // Determine overall status
    const allUp = Object.values(checks).every((c) => c.status === 'up');
    const anyDown = Object.values(checks).some((c) => c.status === 'down');

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (allUp) {
      status = 'healthy';
    } else if (anyDown) {
      status = 'unhealthy';
    } else {
      status = 'degraded';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      service: 'ems-studio-api',
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      checks,
    };
  }

  /**
   * Quick liveness check - just confirms the service is running
   */
  async checkLiveness(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness check - confirms the service can handle requests
   */
  async checkReadiness(): Promise<{
    ready: boolean;
    checks: Record<string, boolean>;
  }> {
    const [dbOk, redisOk] = await Promise.all([
      this.isDatabaseReady(),
      this.isRedisReady(),
    ]);

    return {
      ready: dbOk && redisOk,
      checks: {
        database: dbOk,
        redis: redisOk,
      },
    };
  }

  /**
   * Check database connectivity and performance
   */
  private async checkDatabase(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      // Simple query to check connectivity
      await this.dataSource.query('SELECT 1');

      // Get connection pool stats
      const poolSize = this.dataSource.driver.isReplicated
        ? 'replicated'
        : 'single';

      return {
        status: 'up',
        responseTime: Date.now() - start,
        details: {
          type: 'postgres',
          poolSize,
          connected: this.dataSource.isInitialized,
        },
      };
    } catch (error) {
      this.logger.error(`Database health check failed: ${error.message}`);
      return {
        status: 'down',
        responseTime: Date.now() - start,
        message: error.message,
      };
    }
  }

  /**
   * Check Redis connectivity
   */
  private async checkRedis(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      // Try to set and get a value
      const testKey = `health:check:${Date.now()}`;
      await this.cacheManager.set(testKey, 'ok', 5000);
      const value = await this.cacheManager.get(testKey);
      await this.cacheManager.del(testKey);

      if (value !== 'ok') {
        return {
          status: 'degraded',
          responseTime: Date.now() - start,
          message: 'Cache read/write mismatch',
        };
      }

      return {
        status: 'up',
        responseTime: Date.now() - start,
        details: {
          type: 'redis',
        },
      };
    } catch (error) {
      this.logger.error(`Redis health check failed: ${error.message}`);
      return {
        status: 'down',
        responseTime: Date.now() - start,
        message: error.message,
      };
    }
  }

  /**
   * Check MinIO/S3 storage connectivity
   */
  private async checkStorage(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));

      return {
        status: 'up',
        responseTime: Date.now() - start,
        details: {
          type: 'minio/s3',
          bucket: this.bucket,
        },
      };
    } catch (error) {
      this.logger.error(`Storage health check failed: ${error.message}`);

      // If bucket doesn't exist but service is reachable, it's degraded
      if (
        error.name === 'NotFound' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        return {
          status: 'degraded',
          responseTime: Date.now() - start,
          message: `Bucket ${this.bucket} not found`,
        };
      }

      return {
        status: 'down',
        responseTime: Date.now() - start,
        message: error.message,
      };
    }
  }

  /**
   * Simple database connectivity check
   */
  private async isDatabaseReady(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Simple Redis connectivity check
   */
  private async isRedisReady(): Promise<boolean> {
    try {
      const testKey = `ready:${Date.now()}`;
      await this.cacheManager.set(testKey, 'ok', 1000);
      await this.cacheManager.del(testKey);
      return true;
    } catch {
      return false;
    }
  }
}
