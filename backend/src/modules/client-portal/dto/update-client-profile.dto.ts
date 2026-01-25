import { IsString, IsOptional, IsUrl, IsEnum, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateClientProfileDto {
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    firstName?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    lastName?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiProperty({ required: false })
    @IsUrl()
    @IsOptional()
    avatarUrl?: string;

    @ApiProperty({ required: false })
    @IsEnum(['male', 'female', 'other', 'pnts'])
    @IsOptional()
    gender?: string;

    @ApiProperty({ required: false })
    @IsObject()
    @IsOptional()
    privacyPreferences?: {
        leaderboard_visible?: boolean;
        activity_feed_visible?: boolean;
    };

    @ApiProperty({ required: false })
    @IsObject()
    @IsOptional()
    consentFlags?: {
        marketing?: boolean;
        data_processing?: boolean;
    };
}
