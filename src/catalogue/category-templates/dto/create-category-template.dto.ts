import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryTemplateDto {
  @ApiProperty({ description: 'Template name', example: 'Electronics' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
