import {
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsDateString,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VoucherType } from '../entities/voucher.entity';

export class CreateVoucherDto {
  @ApiProperty({ description: 'Voucher code (unique per store)' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ enum: VoucherType, description: 'Discount type' })
  @IsEnum(VoucherType)
  type: VoucherType;

  @ApiProperty({
    description: 'Discount value (percentage or fixed amount)',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiProperty({ description: 'Minimum purchase amount required', minimum: 0 })
  @IsNumber()
  @Min(0)
  minPurchase: number;

  @ApiPropertyOptional({
    description: 'Whether the voucher is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Expiration date (ISO string)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: 'Maximum total uses (null = unlimited)',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUses?: number | null;

  @ApiPropertyOptional({
    description: 'Maximum uses per customer (null = unlimited)',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUsesPerCustomer?: number | null;
}
