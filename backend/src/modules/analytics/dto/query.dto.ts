import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum PeriodType {
    DAY = 'day',
    WEEK = 'week',
    MONTH = 'month',
}

export class DateRangeQueryDto {
    @ApiPropertyOptional({ description: 'Start date (ISO format)' })
    @IsOptional()
    @IsDateString()
    from?: string;

    @ApiPropertyOptional({ description: 'End date (ISO format)' })
    @IsOptional()
    @IsDateString()
    to?: string;

    @ApiPropertyOptional({ enum: PeriodType, description: 'Aggregation period' })
    @IsOptional()
    @IsEnum(PeriodType)
    period?: PeriodType;
}

export class RevenueQueryDto extends DateRangeQueryDto {
    @ApiPropertyOptional({ description: 'Filter by package ID' })
    @IsOptional()
    @IsString()
    packageId?: string;
}
