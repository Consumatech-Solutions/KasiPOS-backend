import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Password reset token from email link',
    example: 'a1b2c3d4e5f6a7b8',
  })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'New password (minimum 8 characters)',
    example: 'MyNewSecurePass1',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  newPassword: string;
}
