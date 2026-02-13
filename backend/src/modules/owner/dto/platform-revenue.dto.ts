import { IsNumber, IsEnum, IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';
import { RevenueStatus, RevenueType } from '../entities/platform-revenue.entity';

export class CreatePlatformRevenueDto {
    @IsUUID()
    tenantId: string;

    @IsNumber()
    amount: number;

    @IsEnum(RevenueType)
    @IsOptional()
    type?: RevenueType;

    @IsEnum(RevenueStatus)
    @IsOptional()
    status?: RevenueStatus;

    @IsString()
    @IsOptional()
    externalReference?: string;

    @IsDateString()
    @IsOptional()
    billingPeriodStart?: string;

    @IsDateString()
    @IsOptional()
    billingPeriodEnd?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class PlatformRevenueFiltersDto {
    @IsUUID()
    @IsOptional()
    tenantId?: string;

    @IsEnum(RevenueType)
    @IsOptional()
    type?: RevenueType;

    @IsEnum(RevenueStatus)
    @IsOptional()
    status?: RevenueStatus;

    @IsDateString()
    @IsOptional()
    startDate?: string;

    @IsDateString()
    @IsOptional()
    endDate?: string;
}
