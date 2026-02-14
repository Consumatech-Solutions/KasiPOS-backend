import { IsOptional, IsIn, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export type StatsPeriod = 'today' | 'week' | 'month' | 'year';

export class GetStatsDto {
  @ApiPropertyOptional({
    description: 'Filter stats by period',
    enum: ['today', 'week', 'month', 'year'],
    example: 'month',
  })
  @IsOptional()
  @IsIn(['today', 'week', 'month', 'year'])
  period?: StatsPeriod;

  @ApiPropertyOptional({
    description: 'Custom range start date (ISO 8601). When set with endDate, overrides period.',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Custom range end date (ISO 8601). When set with startDate, overrides period.',
    example: '2026-01-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export interface DateRange {
  start: Date;
  end: Date;
}
