import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

class CreateMarketplaceOrderItemDto {
  @IsUUID()
  productId: string;

  @IsString()
  productName: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @Type(() => Number)
  @IsNumber()
  unitPrice: number;

  @Type(() => Number)
  @IsNumber()
  totalPrice: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class CreateMarketplaceOrderDto {
  @IsString()
  marketplaceStoreId: string; // e.g., 'takealot', 'amazon', 'makro'

  @Type(() => Number)
  @IsInt()
  storeId: number;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMarketplaceOrderItemDto)
  items: CreateMarketplaceOrderItemDto[];

  @Type(() => Number)
  @IsNumber()
  subtotal: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  vatAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  serviceFee?: number;

  @Type(() => Number)
  @IsNumber()
  total: number;

  @IsIn(['Cash', 'Card', 'Mobile Money'])
  paymentMethod: 'Cash' | 'Card' | 'Mobile Money';
}
