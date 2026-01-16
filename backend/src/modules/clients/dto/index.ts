import { IsString, IsOptional, IsEmail, IsEnum, IsUUID, MaxLength, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClientDto {
    @ApiProperty()
    @IsString()
    @MaxLength(100)
    firstName: string;

    @ApiProperty()
    @IsString()
    @MaxLength(100)
    lastName: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(50)
    phone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    dateOfBirth?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    studioId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    healthNotes?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    avatarUrl?: string;

    @ApiPropertyOptional({ enum: ['active', 'inactive', 'suspended'] })
    @IsOptional()
    @IsEnum(['active', 'inactive', 'suspended'])
    status?: 'active' | 'inactive' | 'suspended';
}

export class UpdateClientDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    firstName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    lastName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(50)
    phone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    dateOfBirth?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    studioId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    healthNotes?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ enum: ['active', 'inactive', 'suspended'] })
    @IsOptional()
    @IsEnum(['active', 'inactive', 'suspended'])
    status?: 'active' | 'inactive' | 'suspended';
}
