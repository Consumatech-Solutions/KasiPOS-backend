import {
  IsArray,
  IsOptional,
  IsUUID,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddTemplateCategoryItemDto {
  @ApiProperty({
    description: 'Category template ID; a category with this template\'s name will be created in the store if not found',
    example: 'uuid-here',
  })
  @IsUUID()
  categoryTemplateId: string;

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
    description: 'Store ID (required when called by admin; ignored for store admin)',
    example: 'store-uuid-here',
  })
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @ApiProperty({
    description: 'For each item: category template (imported as category) + product templates (imported as products)',
    type: [AddTemplateCategoryItemDto],
    example: [
      { categoryTemplateId: 'cat-tpl-uuid-1', productTemplateIds: ['tpl-uuid-1', 'tpl-uuid-2'] },
      { categoryTemplateId: 'cat-tpl-uuid-2', productTemplateIds: ['tpl-uuid-3'] },
    ],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one category with templates is required' })
  @ValidateNested({ each: true })
  @Type(() => AddTemplateCategoryItemDto)
  items: AddTemplateCategoryItemDto[];
}
