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
}
