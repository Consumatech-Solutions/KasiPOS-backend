import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ClientType } from '../entities/client.entity';

export class GetClientsDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search by client name, ID number, contact number, or email',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by client type',
    enum: ClientType,
  })
  @IsOptional()
  @IsEnum(ClientType)
  type?: ClientType;
}
