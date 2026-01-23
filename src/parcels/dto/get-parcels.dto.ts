import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ParcelStatus } from '../entities/parcel.entity';

export class GetParcelsDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by parcel status',
    enum: ParcelStatus,
  })
  @IsOptional()
  @IsEnum(ParcelStatus)
  status?: ParcelStatus;

  @ApiPropertyOptional({
    description: 'Search by delivery number or collection code',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
