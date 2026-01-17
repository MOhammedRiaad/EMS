import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { TransactionType, TransactionCategory } from '../entities/transaction.entity';

export class CreateTransactionDto {
    @ApiPropertyOptional()
    @IsUUID()
    @IsOptional()
    studioId?: string;

    @ApiProperty({ enum: TransactionType })
    @IsEnum(TransactionType)
    type: TransactionType;

    @ApiProperty({ enum: TransactionCategory })
    @IsEnum(TransactionCategory)
    category: TransactionCategory;

    @ApiProperty()
    @IsNumber()
    amount: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    referenceType?: string;

    @ApiPropertyOptional()
    @IsUUID()
    @IsOptional()
    referenceId?: string;
}
