import { IsEnum, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStockDto {
    @ApiProperty()
    @IsNumber()
    quantity: number;

    @ApiProperty({ enum: ['set', 'add', 'subtract'] })
    @IsEnum(['set', 'add', 'subtract'])
    operation: 'set' | 'add' | 'subtract';
}
