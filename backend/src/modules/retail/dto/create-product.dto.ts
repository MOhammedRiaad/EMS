import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductCategory } from '../entities/product.entity';

export class CreateProductDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty()
    @IsNumber()
    price: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    sku?: string;

    @ApiProperty({ enum: ProductCategory })
    @IsEnum(ProductCategory)
    @IsOptional()
    category?: ProductCategory;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
