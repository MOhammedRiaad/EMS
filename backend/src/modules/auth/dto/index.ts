import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ example: 'admin@demo.ems' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'admin123' })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({ example: '00000000-0000-0000-0000-000000000001' })
    @IsString()
    @IsNotEmpty()
    tenantId: string;
}

export class RegisterDto {
    @ApiProperty()
    @IsEmail()
    email: string;

    @ApiProperty()
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    tenantId: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    firstName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    lastName?: string;

    @ApiPropertyOptional({ enum: ['admin', 'coach', 'client'] })
    @IsOptional()
    @IsIn(['admin', 'coach', 'client'])
    role?: 'admin' | 'coach' | 'client';
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
    };
}
