import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AtLeastOneOf } from '../../common/validators/at-least-one-of.validator';

export class ForgotPasswordDto {
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

  @AtLeastOneOf(['email', 'phone'])
  _atLeastOneIdentifier?: string;
}
