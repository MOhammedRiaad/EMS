import { IsString, IsOptional, IsNotEmpty, MaxLength, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStudioDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    city?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    country?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(50)
    timezone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(255)
    contactEmail?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(50)
    contactPhone?: string;
}

export class UpdateStudioDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(255)
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    city?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    country?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(50)
    timezone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(255)
    contactEmail?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(50)
    contactPhone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    active?: boolean;
}
