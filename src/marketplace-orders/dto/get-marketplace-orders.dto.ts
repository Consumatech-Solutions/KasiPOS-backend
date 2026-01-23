import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { MarketplaceOrderStatus } from '../entities/marketplace-order.entity';

export class GetMarketplaceOrdersDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by marketplace store ID (e.g., takealot, amazon)',
  })
  @IsOptional()
  @IsString()
  marketplaceStoreId?: string;

  @ApiPropertyOptional({
    description: 'Filter by customer ID',
  })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Filter by order status',
    enum: MarketplaceOrderStatus,
  })
  @IsOptional()
  @IsEnum(MarketplaceOrderStatus)
  status?: MarketplaceOrderStatus;

  @ApiPropertyOptional({
    description: 'Search by order code',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
