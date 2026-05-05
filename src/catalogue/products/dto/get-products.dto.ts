import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class GetProductsDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search by product name or barcode',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by category ID',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description:
      'Return only items updated after this ISO 8601 date (for incremental sync)',
    example: '2026-01-20T08:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  updatedAtAfter?: string;

  @ApiPropertyOptional({
    description: 'Sort by product name: asc (A-Z) or desc (Z-A)',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortByName?: 'asc' | 'desc';
}
