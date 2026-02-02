import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EnableTwoFactorDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class VerifyTwoFactorDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ForgotPasswordDto {
  @ApiProperty()
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  newPassword: string;
}
