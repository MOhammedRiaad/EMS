import { PartialType } from '@nestjs/mapped-types';
import { CreateWaitingListEntryDto } from './create-waiting-list.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsNumber, IsBoolean, IsString } from 'class-validator';
import { WaitingListStatus } from '../entities/waiting-list.entity';

export class UpdateWaitingListEntryDto extends PartialType(CreateWaitingListEntryDto) {
    @ApiPropertyOptional({ enum: WaitingListStatus })
    @IsEnum(WaitingListStatus)
    @IsOptional()
    status?: WaitingListStatus;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    priority?: number;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    requiresApproval?: boolean;
}
