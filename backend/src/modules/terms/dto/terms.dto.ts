import { IsBoolean, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTermsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  version: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class AcceptTermsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  termsId: string;
}
