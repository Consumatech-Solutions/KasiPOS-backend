import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class GetCustomersDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search by customer name or contact',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Return only items updated after this ISO 8601 date (for incremental sync)',
    example: '2026-01-20T08:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  updatedAtAfter?: string;
}
