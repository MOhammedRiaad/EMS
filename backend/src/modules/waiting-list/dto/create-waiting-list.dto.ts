import { IsNotEmpty, IsOptional, IsUUID, IsEnum, IsDateString, IsString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWaitingListEntryDto {
    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    clientId: string;

    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    studioId: string;

    @ApiPropertyOptional()
    @IsUUID()
    @IsOptional()
    sessionId?: string;

    @ApiPropertyOptional()
    @IsUUID()
    @IsOptional()
    coachId?: string;

    @ApiPropertyOptional()
    @IsDateString()
    @IsOptional()
    preferredDate?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    preferredTimeSlot?: string;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    requiresApproval?: boolean;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    notificationMethod?: string;
}
