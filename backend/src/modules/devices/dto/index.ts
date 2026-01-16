import { IsString, IsOptional, IsNotEmpty, MaxLength, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDeviceDto {
    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    studioId: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    label: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    serialNumber?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    model?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdateDeviceDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    label?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    serialNumber?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    model?: string;

    @ApiPropertyOptional({ enum: ['available', 'in_use', 'maintenance'] })
    @IsOptional()
    @IsEnum(['available', 'in_use', 'maintenance'])
    status?: 'available' | 'in_use' | 'maintenance';

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    lastMaintenanceDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    nextMaintenanceDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;
}
