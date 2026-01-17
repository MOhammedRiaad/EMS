import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateInBodyScanDto {
    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    clientId: string;

    @ApiProperty()
    @IsDateString()
    @IsNotEmpty()
    scanDate: string;

    @ApiProperty({ description: 'Weight in kg' })
    @Type(() => Number)
    @IsNumber()
    @IsNotEmpty()
    weight: number;

    @ApiProperty({ description: 'Body fat mass in kg' })
    @Type(() => Number)
    @IsNumber()
    @IsNotEmpty()
    bodyFatMass: number;

    @ApiProperty({ description: 'Skeletal muscle mass in kg' })
    @Type(() => Number)
    @IsNumber()
    @IsNotEmpty()
    skeletalMuscleMass: number;

    @ApiProperty({ description: 'Body fat percentage' })
    @Type(() => Number)
    @IsNumber()
    @IsNotEmpty()
    bodyFatPercentage: number;

    // Optional Segmental Analysis
    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    rightArmMuscle?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    leftArmMuscle?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    trunkMuscle?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    rightLegMuscle?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    leftLegMuscle?: number;

    // Optional Additional Metrics
    @ApiPropertyOptional({ description: 'Basal Metabolic Rate' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    bmr?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    visceralFatLevel?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    bodyWater?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    protein?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    mineral?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdateInBodyScanDto extends PartialType(CreateInBodyScanDto) { }

export class InBodyScanQueryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    clientId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    endDate?: string;
}
