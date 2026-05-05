import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  ValidateNested,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerCreditDto {
  @ApiPropertyOptional({ description: 'Credit limit amount', example: 500 })
  @IsNumber()
  @Min(0)
  creditLimit: number;

  @ApiPropertyOptional({
    description: 'Term type: fixed (term required) or variable (term optional)',
    enum: ['fixed', 'variable'],
  })
  @IsIn(['fixed', 'variable'])
  termType: 'fixed' | 'variable';

  @ApiPropertyOptional({
    description: 'Number of days; required when termType is "fixed"',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  term?: number;
}

export class CreditSettingDto {
  @ValidateNested()
  @Type(() => CustomerCreditDto)
  customerCredit: CustomerCreditDto;
}

export class UpdateSettingsDto {
  @ApiPropertyOptional({
    description:
      'When true (default), list prices include VAT. When false, VAT is added on top at checkout.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  vatIncludedInPrice?: boolean;

  @ApiPropertyOptional({
    description:
      'Credit settings: customerCredit with creditLimit, termType, term',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreditSettingDto)
  credit?: CreditSettingDto;
}
