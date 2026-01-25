import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignWaiverDto {
    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    waiverId: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    signatureData: string;
}
