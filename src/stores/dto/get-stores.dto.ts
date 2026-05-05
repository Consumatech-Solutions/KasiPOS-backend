import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { StoreStatus } from '../entities/store.entity';

export class GetStoresDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search by store name or address',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by initial status',
    enum: StoreStatus,
  })
  @IsOptional()
  @IsEnum(StoreStatus)
  status?: StoreStatus;
}
