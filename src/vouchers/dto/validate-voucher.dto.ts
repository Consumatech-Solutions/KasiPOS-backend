import { IsString, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidateVoucherDto {
  @ApiProperty({ description: 'Voucher code to validate' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Cart total amount', minimum: 0 })
  @IsNumber()
  @Min(0)
  cartTotal: number;

  @ApiPropertyOptional({ description: 'Customer ID (for per-customer usage limits)' })
  @IsOptional()
  @IsUUID()
  customerId?: string;
}

export class ValidateVoucherResponseDto {
  valid: boolean;
  voucher?: {
    id: string;
    code: string;
    type: string;
    value: number;
  };
  discountAmount?: number;
  message?: string;
}
