
import { IsArray, IsOptional, IsString, IsNotEmpty, IsUUID, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddTemplateCategoryItemDto {
  @ApiProperty({ description: 'Category name (template category); will be created if not found', example: 'Electronics' })
  @IsString()
  @IsNotEmpty()
  categoryName: string;

  @ApiProperty({
    description: 'Product template IDs to add as products in this category',
    example: ['uuid-1', 'uuid-2'],
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1, { message: 'At least one product template ID is required per category' })
  productTemplateIds: string[];
}

export class AddTemplateDto {
  @ApiPropertyOptional({
    description: 'Store ID to add products to. Required when called by admin; ignored when called by store admin (uses their store).',
    example: 'store-uuid-here',
  })
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @ApiProperty({
    description: 'Array of categories, each with product templates to add to the store',
    type: [AddTemplateCategoryItemDto],
    example: [
      { categoryName: 'Electronics', productTemplateIds: ['tpl-uuid-1', 'tpl-uuid-2'] },
      { categoryName: 'Groceries', productTemplateIds: ['tpl-uuid-3'] },
    ],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one category with templates is required' })
  @ValidateNested({ each: true })
  @Type(() => AddTemplateCategoryItemDto)
  items: AddTemplateCategoryItemDto[];
}
