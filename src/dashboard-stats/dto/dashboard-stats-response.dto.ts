import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StoreCurrency } from '../../settings/entities/store-settings.entity';

export class DashboardStatsPaginationMetaDto {
  @ApiProperty({ example: 12 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 2 })
  totalPages: number;
}

export class ApproachingDueDateCreditDto {
  @ApiProperty({ example: 'transaction-uuid' })
  id: string;

  @ApiProperty({ example: 'customer-uuid' })
  customerId: string;
}

export class ApproachingDueDateGroupDto {
  @ApiProperty({ example: '2026-08-10T14:00:00.000Z' })
  dueDate: string;

  @ApiProperty({ type: [ApproachingDueDateCreditDto] })
  credits: ApproachingDueDateCreditDto[];

  @ApiProperty({ example: 3 })
  clientsOwingCount: number;

  @ApiProperty({ example: 1500.5 })
  totalAmount: number;
}

export class CreditListItemDto {
  @ApiProperty({ example: 'transaction-uuid' })
  id: string;

  @ApiProperty({ example: 'Jane Doe' })
  clientName: string;

  @ApiProperty({ example: 250.0 })
  totalAmount: number;

  @ApiProperty({ example: '2026-08-10T14:00:00.000Z' })
  dueDate: string;
}

export class PaginatedCreditListDto {
  @ApiProperty({ type: [CreditListItemDto] })
  data: CreditListItemDto[];

  @ApiProperty({ type: DashboardStatsPaginationMetaDto })
  meta: DashboardStatsPaginationMetaDto;
}

export class LowStockProductDto {
  @ApiProperty({ example: 'product-uuid' })
  id: string;

  @ApiProperty({ example: 'Sugar 1kg' })
  name: string;

  @ApiProperty({ example: 3 })
  stock: number;

  @ApiProperty({ example: 5 })
  lowStockThreshold: number;
}

export class PaginatedLowStockProductsDto {
  @ApiProperty({ type: [LowStockProductDto] })
  data: LowStockProductDto[];

  @ApiProperty({ type: DashboardStatsPaginationMetaDto })
  meta: DashboardStatsPaginationMetaDto;
}

export class NoStockProductDto {
  @ApiProperty({ example: 'product-uuid' })
  id: string;

  @ApiProperty({ example: 'Flour 2kg' })
  name: string;

  @ApiProperty({ example: 0 })
  stock: number;
}

export class PaginatedNoStockProductsDto {
  @ApiProperty({ type: [NoStockProductDto] })
  data: NoStockProductDto[];

  @ApiProperty({ type: DashboardStatsPaginationMetaDto })
  meta: DashboardStatsPaginationMetaDto;
}

export class ProductSalesStatDto {
  @ApiProperty({ example: 'product-uuid' })
  productId: string;

  @ApiProperty({ example: 42 })
  unitsSold: number;

  @ApiProperty({ example: 1250.5 })
  revenue: number;
}

export class DashboardStatsResponseDto {
  @ApiProperty({
    enum: [StoreCurrency.USD, StoreCurrency.CDF, StoreCurrency.ZAR],
    example: StoreCurrency.USD,
    description: 'Principal store currency used to normalize monetary values',
  })
  currency: StoreCurrency;

  @ApiProperty({ example: 45000.5 })
  totalSales: number;

  @ApiProperty({ example: 1250.0 })
  todaySales: number;

  @ApiProperty({ example: 84 })
  totalCustomers: number;

  @ApiProperty({ example: 3200.0 })
  outstandingCredits: number;

  @ApiProperty({ type: [ApproachingDueDateGroupDto] })
  approachingDueDates: ApproachingDueDateGroupDto[];

  @ApiProperty({ type: PaginatedCreditListDto })
  creditsToRecover: PaginatedCreditListDto;

  @ApiProperty({ type: PaginatedCreditListDto })
  overdueCredits: PaginatedCreditListDto;

  @ApiProperty({ type: PaginatedLowStockProductsDto })
  lowStockProducts: PaginatedLowStockProductsDto;

  @ApiProperty({ type: PaginatedNoStockProductsDto })
  noStockProducts: PaginatedNoStockProductsDto;

  @ApiProperty({ type: [ProductSalesStatDto] })
  mostSoldProducts: ProductSalesStatDto[];

  @ApiPropertyOptional({ type: ProductSalesStatDto, nullable: true })
  mostProfitableProduct: ProductSalesStatDto | null;
}
