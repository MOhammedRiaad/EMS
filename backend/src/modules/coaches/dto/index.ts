import { IsString, IsOptional, IsNotEmpty, IsUUID, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCoachDto {
    @ApiProperty({ description: 'User ID for the coach account' })
    @IsUUID()
    @IsNotEmpty()
    userId: string;

    @ApiProperty({ description: 'Studio ID where the coach works' })
    @IsUUID()
    @IsNotEmpty()
    studioId: string;

    @ApiPropertyOptional({ description: 'Coach bio' })
    @IsOptional()
    @IsString()
    bio?: string;

    @ApiPropertyOptional({ description: 'Coach specializations', type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    specializations?: string[];
}

export class UpdateCoachDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    bio?: string;

    @ApiPropertyOptional({ type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    specializations?: string[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    active?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    studioId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    availabilityRules?: any[];
}

export class CreateCoachWithUserDto {
    @ApiProperty({ description: 'User email address' })
    @IsString()
    email: string;

    @ApiProperty({ description: 'User password' })
    @IsString()
    password: string;

    @ApiProperty()
    @IsString()
    firstName: string;

    @ApiProperty()
    @IsString()
    lastName: string;

    @ApiProperty({ enum: ['male', 'female', 'other', 'pnts'] })
    @IsString()
    gender: 'male' | 'female' | 'other' | 'pnts';

    @ApiProperty()
    @IsUUID()
    studioId: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    bio?: string;

    @ApiPropertyOptional({ type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    specializations?: string[];

    @ApiPropertyOptional({ enum: ['male', 'female', 'any'], default: 'any' })
    @IsOptional()
    @IsString()
    preferredClientGender?: 'male' | 'female' | 'any';
}
