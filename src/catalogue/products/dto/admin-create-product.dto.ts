import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminCreateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Laptop Pro 15',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Product barcode',
    example: '1234567890123',
  })
  @IsString()
  @IsOptional()
  barCode?: string;

  @ApiProperty({
    description: 'Brand ID',
    example: 'uuid-here',
  })
  @IsUUID()
  @IsNotEmpty()
  brandId: string;

  @ApiProperty({
    description: 'Category ID',
    example: 'uuid-here',
  })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiPropertyOptional({
    description: 'Supplier name',
    example: 'Tech Distributors Ltd',
  })
  @IsString()
  @IsOptional()
  supplier?: string;

  @ApiPropertyOptional({
    description: 'Unit of measure',
    example: 'piece',
  })
  @IsString()
  @IsOptional()
  unitOfMeasure?: string;
}
