import { IsArray, IsUUID, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AddTemplateCategoryItemDto {
  @ApiProperty({ description: 'Category ID', example: 'uuid-here' })
  @IsUUID()
  categoryId: string;

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
  @ApiProperty({
    description: 'Array of categories, each with product templates to add to the store',
    type: [AddTemplateCategoryItemDto],
    example: [
      { categoryId: 'cat-uuid-1', productTemplateIds: ['tpl-uuid-1', 'tpl-uuid-2'] },
      { categoryId: 'cat-uuid-2', productTemplateIds: ['tpl-uuid-3'] },
    ],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one category with templates is required' })
  @ValidateNested({ each: true })
  @Type(() => AddTemplateCategoryItemDto)
  items: AddTemplateCategoryItemDto[];
}
