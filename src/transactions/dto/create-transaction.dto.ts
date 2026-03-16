import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

export class TransactionDiscountDto {
  @IsIn(['amount', 'percentage'], {
    message: 'discountType must be "amount" or "percentage"',
  })
  discountType: 'amount' | 'percentage';

  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'discountAmount must be >= 0' })
  discountAmount: number;

  @IsString()
  discountReason: string;
}

/** UUID or temp-X (resolved to server ID by TempIdResolveInterceptor before use). */
const UUID_OR_TEMP = /^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|temp-\d+)$/i;

class CreateTransactionItemDto {
  @IsString()
  @Matches(UUID_OR_TEMP, { message: 'productId must be a UUID or a temp ID (temp-<number>)' })
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
  @IsUUID()
  storeId: string;

  @IsOptional()
  @IsString()
  @Matches(UUID_OR_TEMP, { message: 'customerId must be a UUID or a temp ID (temp-<number>)' })
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
  @ValidateNested()
  @Type(() => TransactionDiscountDto)
  discount?: TransactionDiscountDto;
}
