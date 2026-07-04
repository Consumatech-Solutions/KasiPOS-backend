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

  @ApiPropertyOptional({
    description: 'Store display currency',
    enum: ['USD', 'CDF', 'ZAR'],
    example: 'USD',
  })
  @IsOptional()
  @IsIn(['USD', 'CDF', 'ZAR'])
  currency?: 'USD' | 'CDF' | 'ZAR';

  @ApiPropertyOptional({
    description: 'Exchange rate: 1 USD = ? CDF',
    example: 2850.5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cdfUsdExRate?: number;

  @ApiPropertyOptional({
    description: 'Exchange rate: 1 USD = ? ZAR',
    example: 18.25,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  zarUsdExRate?: number;
}
