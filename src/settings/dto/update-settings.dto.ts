import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiPropertyOptional({
    description:
      'When true (default), list prices include VAT. When false, VAT is added on top at checkout.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  vatIncludedInPrice?: boolean;
}
