import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({ example: 'owner@example.com', description: 'Account email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Jane Doe', description: 'Owner display name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Jane\'s Shop', description: 'Store display name' })
  @IsString()
  @IsNotEmpty()
  storeName: string;

  @ApiProperty({
    example: 'SecurePass123',
    description: 'Password (minimum 8 characters)',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiPropertyOptional({
    example: '0812345678',
    description: 'Optional contact phone number',
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;
}
