import { IsOptional, IsString, IsDateString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class GetTransactionsDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by date (ISO date string)',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Filter by customer ID (UUID)',
  })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Search by transaction ID or customer name',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
