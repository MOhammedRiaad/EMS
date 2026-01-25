import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, ValidateNested, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../entities/sale.entity';

class SaleItemDto {
    @ApiProperty()
    @IsUUID()
    productId: string;

    @ApiProperty()
    @IsNumber()
    @Min(1)
    quantity: number;
}

export class CreateSaleDto {
    @ApiProperty()
    @IsUUID()
    studioId: string;

    @ApiProperty({ required: false })
    @IsUUID()
    @IsOptional()
    clientId?: string;

    @ApiProperty({ enum: PaymentMethod })
    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod;

    @ApiProperty({ type: [SaleItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SaleItemDto)
    items: SaleItemDto[];
}
