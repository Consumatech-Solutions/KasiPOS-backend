import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class GetProductTemplatesDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search by template name or barcode',
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
    description: 'Filter templates not yet assigned to this store ID',
  })
  @IsOptional()
  @IsUUID()
  storeId?: string;
}
