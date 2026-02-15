import { PartialType } from '@nestjs/swagger';
import { AdminCreateProductDto } from './admin-create-product.dto';
import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdminUpdateProductDto extends PartialType(AdminCreateProductDto) {
  @ApiPropertyOptional({
    description: 'Product price',
    example: 999.99,
  })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({
    description: 'Product cost price',
    example: 700.0,
  })
  @IsNumber()
  @IsOptional()
  costPrice?: number;

  @ApiPropertyOptional({
    description: 'Stock quantity',
    example: 10,
  })
  @IsNumber()
  @IsOptional()
  stock?: number;

  @ApiPropertyOptional({
    description: 'Product image URL',
    example: 'https://example.com/product.jpg',
  })
  @IsString()
  @IsOptional()
  productImage?: string;

  @ApiPropertyOptional({
    description: 'Low stock threshold',
    example: 5,
  })
  @IsNumber()
  @IsOptional()
  lowStockThreshold?: number;

  @ApiPropertyOptional({
    description: 'Store UUID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  @IsOptional()
  storeId?: string;
}
