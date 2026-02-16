import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductTemplateDto {
  @ApiProperty({
    description: 'Template name',
    example: 'Laptop Pro 15',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Category ID',
    example: 'uuid-here',
  })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Brand ID',
    example: 'uuid-here',
  })
  @IsUUID()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional({
    description: 'Product price',
    example: 999.99,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({
    description: 'Product cost price',
    example: 700.0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  costPrice?: number;

  @ApiPropertyOptional({
    description: 'Stock quantity',
    example: 10,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @ApiPropertyOptional({
    description: 'Product barcode',
    example: '1234567890123',
  })
  @IsString()
  @IsOptional()
  barCode?: string;

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
  @Min(0)
  @IsOptional()
  lowStockThreshold?: number;

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
