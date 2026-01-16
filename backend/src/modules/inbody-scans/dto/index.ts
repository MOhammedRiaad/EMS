import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

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
    @IsNumber()
    @IsNotEmpty()
    weight: number;

    @ApiProperty({ description: 'Body fat mass in kg' })
    @IsNumber()
    @IsNotEmpty()
    bodyFatMass: number;

    @ApiProperty({ description: 'Skeletal muscle mass in kg' })
    @IsNumber()
    @IsNotEmpty()
    skeletalMuscleMass: number;

    @ApiProperty({ description: 'Body fat percentage' })
    @IsNumber()
    @IsNotEmpty()
    bodyFatPercentage: number;

    // Optional Segmental Analysis
    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    rightArmMuscle?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    leftArmMuscle?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    trunkMuscle?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    rightLegMuscle?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    leftLegMuscle?: number;

    // Optional Additional Metrics
    @ApiPropertyOptional({ description: 'Basal Metabolic Rate' })
    @IsOptional()
    @IsNumber()
    bmr?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    visceralFatLevel?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    bodyWater?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    protein?: number;

    @ApiPropertyOptional()
    @IsOptional()
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
