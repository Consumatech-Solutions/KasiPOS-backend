import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeliveryMethod } from '../entities/purchase-order.entity';

class CreatePurchaseOrderItemDto {
  @ApiProperty({ description: 'Product UUID' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Product name' })
  @IsString()
  productName: string;

  @ApiProperty({ description: 'Quantity', minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Unit price' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ description: 'Group price' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  groupPrice: number;

  @ApiProperty({ description: 'Total price for this item' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalPrice: number;
}

export class CreatePurchaseOrderDto {
  @ApiProperty({
    type: [CreatePurchaseOrderItemDto],
    description: 'Order items',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items: CreatePurchaseOrderItemDto[];

  @ApiProperty({ description: 'Subtotal amount' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiProperty({ description: 'Delivery fee' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  deliveryFee: number;

  @ApiProperty({ description: 'Total amount' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total: number;

  @ApiProperty({ enum: DeliveryMethod, description: 'Delivery method' })
  @IsEnum(DeliveryMethod)
  deliveryMethod: DeliveryMethod;
}
