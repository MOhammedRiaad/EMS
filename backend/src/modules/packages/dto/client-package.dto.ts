import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional, IsDateString, IsNumber } from 'class-validator';

export class AssignPackageDto {
    @ApiProperty()
    @IsUUID()
    clientId: string;

    @ApiProperty()
    @IsUUID()
    packageId: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    paymentMethod?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    paymentNotes?: string;

    @ApiPropertyOptional()
    @IsDateString()
    @IsOptional()
    purchaseDate?: string;
}

export class RenewPackageDto {
    @ApiPropertyOptional({ description: 'New package ID if switching, omit to renew with same' })
    @IsUUID()
    @IsOptional()
    newPackageId?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    paymentMethod?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    paymentNotes?: string;
}

export class AdjustSessionsDto {
    @ApiProperty({ description: 'Number of sessions to add (positive) or remove (negative)' })
    @IsNumber()
    adjustment: number;

    @ApiProperty({ description: 'Reason for manual adjustment' })
    @IsString()
    reason: string;
}
