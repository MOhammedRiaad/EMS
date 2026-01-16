import { IsString, IsOptional, IsNotEmpty, MaxLength, IsUUID, IsInt, Min, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoomDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;

    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    studioId: string;

    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    capacity?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;
}

export class UpdateRoomDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Min(1)
    capacity?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    active?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    studioId?: string;
}
