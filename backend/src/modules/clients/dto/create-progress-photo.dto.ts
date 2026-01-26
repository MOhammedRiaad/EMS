import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProgressPhotoDto {
    @ApiProperty()
    @IsString()
    photoUrl: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ enum: ['front', 'back', 'side', 'other'] })
    @IsOptional()
    @IsEnum(['front', 'back', 'side', 'other'])
    type?: 'front' | 'back' | 'side' | 'other';
}
