import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MinLength,
  Matches,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({
    example: 'ZA',
    description: 'ISO 3166-1 alpha-2 country code',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 2)
  @Matches(/^[A-Za-z]{2}$/, {
    message: 'countryCode must be a 2-letter ISO code (e.g. ZA)',
  })
  countryCode: string;

  @ApiProperty({
    example: '27812345678',
    description: 'E.164 digits-only phone number (country code + local number)',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}
