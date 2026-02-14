import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class GetBrandsDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search by brand name',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
