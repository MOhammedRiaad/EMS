import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsUUID,
  MaxLength,
  IsDateString,
} from 'class-validator';
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

  @ApiPropertyOptional()
  @IsOptional()
  healthGoals?: any[];

  @ApiPropertyOptional()
  @IsOptional()
  medicalHistory?: any;

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

  @ApiPropertyOptional({ enum: ['male', 'female', 'other', 'prefer_not_to_say'] })
  @IsOptional()
  @IsEnum(['male', 'female', 'other', 'prefer_not_to_say'])
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';

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

  @ApiPropertyOptional()
  @IsOptional()
  healthGoals?: any[];

  @ApiPropertyOptional()
  @IsOptional()
  medicalHistory?: any;

  @ApiPropertyOptional({ enum: ['active', 'inactive', 'suspended'] })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'suspended'])
  status?: 'active' | 'inactive' | 'suspended';
}

export class CreateClientWithUserDto {
  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password (min 6 characters)' })
  @IsString()
  password: string;

  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiProperty({ enum: ['male', 'female', 'other', 'prefer_not_to_say'] })
  @IsEnum(['male', 'female', 'other', 'prefer_not_to_say'])
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  studioId?: string;

  @ApiPropertyOptional({ enum: ['active', 'inactive'], default: 'active' })
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';
}
