import { IsString, IsNotEmpty, MinLength, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'admin@kasipos.demo',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePass123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  password: string;
}
