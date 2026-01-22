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

class CreateTransactionItemDto {
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

export class CreateTransactionDto {
  @Type(() => Number)
  @IsInt()
  storeId: number;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTransactionItemDto)
  items: CreateTransactionItemDto[];

  @Type(() => Number)
  @IsNumber()
  total: number;

  @IsIn(['Cash', 'Card', 'Mobile Money'])
  paymentMethod: 'Cash' | 'Card' | 'Mobile Money';

  @IsOptional()
  @IsString()
  voucherCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  discountAmount?: number;
}
