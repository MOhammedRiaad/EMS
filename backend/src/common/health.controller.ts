import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService, HealthCheckResult } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) { }

  /**
   * Full health check - returns detailed status of all components
   */
  @Get()
  @ApiOperation({ summary: 'Full health check with component details' })
  @ApiResponse({
    status: 200,
    description: 'Health check result',
    schema: {
      properties: {
        status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
        timestamp: { type: 'string' },
        service: { type: 'string' },
        version: { type: 'string' },
        uptime: { type: 'number' },
        checks: {
          type: 'object',
          properties: {
            database: { type: 'object' },
            redis: { type: 'object' },
            storage: { type: 'object' },
          },
        },
      },
    },
  })
  async check(): Promise<HealthCheckResult> {
    return this.healthService.checkHealth();
  }

  /**
   * Liveness probe - Kubernetes livenessProbe endpoint
   * Returns 200 if the service is running
   */
  @Get('live')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liveness probe - is the service running?' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  async live() {
    return this.healthService.checkLiveness();
  }

  /**
   * Readiness probe - Kubernetes readinessProbe endpoint
   * Returns 200 if the service can handle requests, 503 otherwise
   */
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe - can the service handle requests?' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async ready() {
    const result = await this.healthService.checkReadiness();
    if (!result.ready) {
      // Return 503 Service Unavailable if not ready
      throw new Error('Service not ready');
    }
    return result;
  }

  /**
   * Simple status endpoint for load balancers
   */
  @Get('status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Simple status check' })
  status() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'ems-studio-api',
    };
  }
}
