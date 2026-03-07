import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @IsOptional()
  @IsString()
  _tempId?: string;
  @ApiProperty({ description: 'Category name', example: 'Electronics' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Store ID (admin only; omit for store admin to use their store)' })
  @IsUUID()
  @IsOptional()
  storeId?: string;
}
