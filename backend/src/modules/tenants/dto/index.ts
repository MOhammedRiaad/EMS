import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantDto {
    @ApiProperty({ description: 'Business name', example: 'My EMS Studio' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @ApiPropertyOptional({ description: 'URL-friendly slug (auto-generated if not provided)' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    slug?: string;
}


export class TenantBrandingDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    logoUrl?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    primaryColor?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    secondaryColor?: string;
}

export class UpdateTenantDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(255)
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(255)
    address?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(50)
    phone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    city?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    state?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(20)
    zipCode?: string;

    @ApiPropertyOptional()
    @IsOptional()
    settings?: Record<string, any>;

    @ApiPropertyOptional()
    @IsOptional()
    branding?: TenantBrandingDto;
}

