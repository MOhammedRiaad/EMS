import { IsDateString, IsNotEmpty, IsOptional, IsString, IsInt, Min, Max, IsIn, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateSessionDto {
    @ApiProperty()
    @IsUUID()
    studioId: string;

    @ApiProperty()
    @IsUUID()
    roomId: string;

    @ApiProperty()
    @IsUUID()
    coachId: string;

    @ApiProperty()
    @IsUUID()
    clientId: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    emsDeviceId?: string;

    @ApiProperty({ example: '2024-01-15T10:00:00Z' })
    @IsDateString()
    startTime: string;

    @ApiProperty({ example: '2024-01-15T10:30:00Z' })
    @IsDateString()
    endTime: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    programType?: string;

    @ApiPropertyOptional({ minimum: 1, maximum: 10 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(10)
    intensityLevel?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;
}

export class SessionQueryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    studioId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    coachId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    clientId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    from?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    to?: string;

    @ApiPropertyOptional({ enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'] })
    @IsOptional()
    @IsIn(['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'])
    status?: string;
}

export class UpdateSessionStatusDto {
    @ApiProperty({ enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'] })
    @IsIn(['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'])
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    cancelledReason?: string;
}

export class UpdateSessionDto extends PartialType(CreateSessionDto) { }
