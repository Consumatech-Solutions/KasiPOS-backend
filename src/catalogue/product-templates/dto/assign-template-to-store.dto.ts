import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignTemplateToStoreDto {
  @ApiProperty({
    description: 'Store ID to assign the product to',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  storeId: string;

  @ApiPropertyOptional({
    description: 'Override: Category ID',
    example: 'uuid-here',
  })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Override: Brand ID',
    example: 'uuid-here',
  })
  @IsUUID()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional({
    description: 'Override: Product price',
    example: 999.99,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({
    description: 'Override: Product cost price',
    example: 700.0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  costPrice?: number;

  @ApiPropertyOptional({
    description: 'Override: Stock quantity',
    example: 10,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @ApiPropertyOptional({
    description: 'Override: Product barcode',
    example: '1234567890123',
  })
  @IsString()
  @IsOptional()
  barCode?: string;

  @ApiPropertyOptional({
    description: 'Override: Product image URL',
    example: 'https://example.com/product.jpg',
  })
  @IsString()
  @IsOptional()
  productImage?: string;

  @ApiPropertyOptional({
    description: 'Override: Low stock threshold',
    example: 5,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  lowStockThreshold?: number;

  @ApiPropertyOptional({
    description: 'Override: Supplier name',
    example: 'Tech Distributors Ltd',
  })
  @IsString()
  @IsOptional()
  supplier?: string;

  @ApiPropertyOptional({
    description: 'Override: Unit of measure',
    example: 'piece',
  })
  @IsString()
  @IsOptional()
  unitOfMeasure?: string;
}
