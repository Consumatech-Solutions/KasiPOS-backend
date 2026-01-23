import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MarketplaceOrderStatus } from '../entities/marketplace-order.entity';

export class UpdateMarketplaceOrderDto {
  @ApiPropertyOptional({
    description: 'Update order status',
    enum: MarketplaceOrderStatus,
  })
  @IsOptional()
  @IsEnum(MarketplaceOrderStatus)
  status?: MarketplaceOrderStatus;
}
