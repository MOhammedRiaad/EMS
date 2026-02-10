import {
    Controller,
    Post,
    Body,
    UseGuards,
    HttpCode,
    HttpStatus,
    BadRequestException,
} from '@nestjs/common';
import { IsOptional, IsString, IsArray, IsBoolean } from 'class-validator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TenantGuard, RolesGuard, Roles } from '../../common/guards';
import { TenantId } from '../../common/decorators';
import { ImportService, ImportClientRow, ImportCoachRow } from './import.service';

class ImportClientsDto {
    @IsOptional()
    @IsString()
    csvContent?: string;

    @IsOptional()
    @IsArray()
    rows?: ImportClientRow[];

    @IsOptional()
    @IsBoolean()
    validateOnly?: boolean;

    @IsOptional()
    @IsBoolean()
    importWithinLimit?: boolean;
}

class ImportCoachesDto {
    @IsOptional()
    @IsString()
    csvContent?: string;

    @IsOptional()
    @IsArray()
    rows?: ImportCoachRow[];

    @IsOptional()
    @IsBoolean()
    validateOnly?: boolean;

    @IsOptional()
    @IsBoolean()
    importWithinLimit?: boolean;
}

@ApiTags('import')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@Roles('tenant_owner', 'admin')
@Controller('import')
export class ImportController {
    constructor(private readonly importService: ImportService) { }

    @Post('clients/validate')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Validate client import against package limits' })
    async validateClientImport(
        @TenantId() tenantId: string,
        @Body() dto: ImportClientsDto,
    ) {
        const rows = this.parseClientRows(dto);
        return this.importService.validateClientImport(tenantId, rows.length);
    }

    @Post('clients')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Import clients from CSV or JSON rows' })
    @ApiBody({ type: ImportClientsDto })
    async importClients(
        @TenantId() tenantId: string,
        @Body() dto: ImportClientsDto,
    ) {
        let rows = this.parseClientRows(dto);

        // Validate against package limits
        const validation = await this.importService.validateClientImport(
            tenantId,
            rows.length,
        );

        // If validateOnly flag is set, just return validation result
        if (dto.validateOnly) {
            return { validation, imported: false };
        }

        // Check if import would exceed limits
        if (validation.wouldExceedBy > 0) {
            if (dto.importWithinLimit) {
                // Only import up to the available limit
                rows = rows.slice(0, validation.importableCount);
            } else {
                // Reject import and return validation info
                throw new BadRequestException({
                    message: validation.message,
                    validation,
                });
            }
        }

        // If no rows left after limiting, return early
        if (rows.length === 0) {
            return {
                validation,
                result: {
                    totalRows: 0,
                    successCount: 0,
                    failedCount: 0,
                    errors: [],
                },
            };
        }

        const result = await this.importService.importClients(tenantId, rows);
        return { validation, result };
    }

    @Post('coaches/validate')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Validate coach import against package limits' })
    async validateCoachImport(
        @TenantId() tenantId: string,
        @Body() dto: ImportCoachesDto,
    ) {
        const rows = this.parseCoachRows(dto);
        return this.importService.validateCoachImport(tenantId, rows.length);
    }

    @Post('coaches')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Import coaches from CSV or JSON rows' })
    @ApiBody({ type: ImportCoachesDto })
    async importCoaches(
        @TenantId() tenantId: string,
        @Body() dto: ImportCoachesDto,
    ) {
        let rows = this.parseCoachRows(dto);

        const validation = await this.importService.validateCoachImport(
            tenantId,
            rows.length,
        );

        if (dto.validateOnly) {
            return { validation, imported: false };
        }

        if (validation.wouldExceedBy > 0) {
            if (dto.importWithinLimit) {
                rows = rows.slice(0, validation.importableCount);
            } else {
                throw new BadRequestException({
                    message: validation.message,
                    validation,
                });
            }
        }

        if (rows.length === 0) {
            return {
                validation,
                result: {
                    totalRows: 0,
                    successCount: 0,
                    failedCount: 0,
                    errors: [],
                },
            };
        }

        const result = await this.importService.importCoaches(tenantId, rows);
        return { validation, result };
    }

    private parseClientRows(dto: ImportClientsDto): ImportClientRow[] {
        if (dto.csvContent) {
            return this.importService.parseCSV<ImportClientRow>(dto.csvContent);
        } else if (dto.rows && dto.rows.length > 0) {
            return dto.rows;
        }
        throw new BadRequestException('Must provide either csvContent or rows');
    }

    private parseCoachRows(dto: ImportCoachesDto): ImportCoachRow[] {
        if (dto.csvContent) {
            return this.importService.parseCSV<ImportCoachRow>(dto.csvContent);
        } else if (dto.rows && dto.rows.length > 0) {
            return dto.rows;
        }
        throw new BadRequestException('Must provide either csvContent or rows');
    }
}
