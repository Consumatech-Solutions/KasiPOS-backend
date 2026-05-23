import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AtLeastOneOf } from '../../common/validators/at-least-one-of.validator';

export class LoginDto {
  @ApiPropertyOptional({
    description: 'User email (provide email or phone)',
    example: 'owner@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'User phone number (provide email or phone)',
    example: '0812345678',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePass123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  password: string;

  @AtLeastOneOf(['email', 'phone'])
  _atLeastOneIdentifier?: string;
}
