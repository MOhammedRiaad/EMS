import { IsDateString, IsOptional, IsString, IsUUID, IsNumber, Min, Max, IsArray, ValidateNested, IsInt, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class RecurrenceSlotDto {
    @ApiProperty()
    @IsInt()
    @Min(0)
    @Max(6)
    dayOfWeek: number;

    @ApiProperty({ example: '10:00' })
    @IsString()
    startTime: string;
}

export class ClientBookSessionDto {
    @ApiProperty({ example: '2024-01-15T10:00:00Z' })
    @IsDateString()
    startTime: string;

    @ApiProperty({ example: '2024-01-15T10:30:00Z' })
    @IsDateString()
    endTime: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    studioId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    coachId?: string;

    @ApiPropertyOptional({ enum: ['daily', 'weekly', 'biweekly', 'monthly', 'variable'] })
    @IsOptional()
    @IsString()
    @IsIn(['daily', 'weekly', 'biweekly', 'monthly', 'variable'])
    recurrencePattern?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'variable';

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    recurrenceEndDate?: string;

    @ApiPropertyOptional({ type: [RecurrenceSlotDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RecurrenceSlotDto)
    recurrenceSlots?: RecurrenceSlotDto[];
}
