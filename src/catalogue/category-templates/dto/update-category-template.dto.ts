import { PartialType } from '@nestjs/swagger';
import { CreateCategoryTemplateDto } from './create-category-template.dto';

export class UpdateCategoryTemplateDto extends PartialType(
  CreateCategoryTemplateDto,
) {}
