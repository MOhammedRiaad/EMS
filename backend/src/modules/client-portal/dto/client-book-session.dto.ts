import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
}
