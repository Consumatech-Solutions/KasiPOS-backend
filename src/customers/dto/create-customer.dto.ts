import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @IsOptional()
  @IsString()
  _tempId?: string;
  @ApiProperty({
    description: 'Customer name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Customer contact information (phone, email, etc.)',
    example: '+1234567890',
  })
  @IsString()
  @IsNotEmpty()
  contact: string;

  @ApiPropertyOptional({
    description: 'Initial loyalty points',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  loyaltyPoints?: number;
}
