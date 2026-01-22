import { IsUUID, IsInt, IsEnum, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockAdjustmentReason } from '../entities/stock-adjustment.entity';

export class CreateStockAdjustmentDto {
  @ApiProperty({ description: 'Product UUID' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'New stock quantity', minimum: 0 })
  @IsInt()
  @Min(0)
  newStock: number;

  @ApiProperty({ enum: StockAdjustmentReason, description: 'Reason for adjustment' })
  @IsEnum(StockAdjustmentReason)
  reason: StockAdjustmentReason;

  @ApiPropertyOptional({ description: 'Optional note about the adjustment' })
  @IsOptional()
  @IsString()
  note?: string;
}
