import { ApiProperty } from '@nestjs/swagger';

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

export class DashboardStatsCustomersOnCreditDto {
  @ApiProperty({
    type: [String],
    example: ['uuid-1', 'uuid-2'],
    description: 'Customer IDs with outstanding credit',
  })
  data: string[];

  @ApiProperty({ type: DashboardStatsPaginationMetaDto })
  meta: DashboardStatsPaginationMetaDto;
}

export class DashboardStatsSalesTrendItemDto {
  @ApiProperty({ example: '2026-07-02' })
  date: string;

  @ApiProperty({ example: 1250.5 })
  sales: number;
}

export class DashboardStatsResponseDto {
  @ApiProperty({ example: 45000.5 })
  totalSales: number;

  @ApiProperty({ example: 1250.0 })
  todaySales: number;

  @ApiProperty({ example: 84 })
  totalCustomers: number;

  @ApiProperty({ example: 3200.0 })
  outstandingCredits: number;

  @ApiProperty({ type: DashboardStatsCustomersOnCreditDto })
  customersOnCredit: DashboardStatsCustomersOnCreditDto;

  @ApiProperty({
    type: [String],
    example: ['uuid-1', 'uuid-2', 'uuid-3', 'uuid-4', 'uuid-5'],
    description: 'Latest 5 paid transaction IDs',
  })
  recentSales: string[];

  @ApiProperty({ type: [DashboardStatsSalesTrendItemDto] })
  salesTrend: DashboardStatsSalesTrendItemDto[];
}
