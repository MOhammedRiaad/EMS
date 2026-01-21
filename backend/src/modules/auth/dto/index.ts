import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsIn, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ example: 'admin@demo.ems' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'admin123' })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000001' })
    @IsString()
    @IsOptional()
    tenantId?: string;
}

// For public registration - creates new Tenant + Tenant Owner
export class RegisterTenantOwnerDto {
    @ApiProperty({ description: 'Business name for the tenant' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    businessName: string;

    @ApiProperty()
    @IsEmail()
    email: string;

    @ApiProperty()
    @IsString()
    @MinLength(6)
    password: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    firstName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    lastName?: string;
}

// For admin/owner to create users within their tenant
export class CreateUserDto {
    @ApiProperty()
    @IsEmail()
    email: string;

    @ApiProperty()
    @IsString()
    @MinLength(6)
    password: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    firstName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    lastName?: string;

    @ApiProperty({ enum: ['admin', 'coach', 'client'] })
    @IsIn(['admin', 'coach', 'client'])
    role: 'admin' | 'coach' | 'client';
}

export class AuthResponseDto {
    @ApiProperty()
    accessToken: string;

    @ApiProperty()
    user: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        role: string;
        tenantId: string;
        clientId?: string;
    };

    @ApiPropertyOptional()
    tenant?: {
        id: string;
        name: string;
        isComplete: boolean;
    };
}

export class TwoFactorRequiredResponse {
    @ApiProperty()
    requiresTwoFactor: boolean;

    @ApiProperty()
    userId: string;

    @ApiProperty()
    tenantId: string;
}

export class SetupPasswordDto {
    @ApiProperty()
    @IsString()
    token: string;

    @ApiProperty()
    @IsString()
    @MinLength(8)
    password: string;
}

export * from './security.dto';
