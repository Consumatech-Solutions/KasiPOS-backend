import {
  IsOptional,
  IsString,
  IsDateString,
  IsUUID,
  IsIn,
  IsEnum,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { StoreCurrency } from '../../settings/entities/store-settings.entity';
import { TransactionStatus } from '../entities/transaction.entity';

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

  @ApiPropertyOptional({
    description: 'Filter by transaction currency',
    enum: [StoreCurrency.USD, StoreCurrency.CDF, StoreCurrency.ZAR],
    example: StoreCurrency.USD,
  })
  @IsOptional()
  @IsIn([StoreCurrency.USD, StoreCurrency.CDF, StoreCurrency.ZAR])
  currency?: StoreCurrency;

  @ApiPropertyOptional({
    description: 'Filter by transaction status',
    enum: TransactionStatus,
    example: TransactionStatus.PAID,
  })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;
}
