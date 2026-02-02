import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateParqDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({
    description: 'Map of question IDs to boolean answers (true = yes/risk)',
    example: { q1: false, q2: true },
  })
  @IsObject()
  @IsNotEmpty()
  responses: Record<string, boolean>;

  @ApiProperty({
    description: 'Base64 signature data',
  })
  @IsString()
  @IsNotEmpty()
  signatureData: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  hasRisk?: boolean; // Can be computed by frontend or backend
}
