import { IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SetPasswordStoreAdminDto {
  @ApiPropertyOptional({
    description:
      'Store admin phone (required when not using reset token from link)',
    example: '0812345678',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description:
      'Temporary password received by SMS (required when not using reset token)',
    example: 'Ab12Cd34Ef',
  })
  @IsString()
  @IsOptional()
  temporaryPassword?: string;

  @ApiPropertyOptional({
    description:
      'Short reset token from SMS link (when present, only newPassword is required)',
    example: 'a1b2c3d4e5f6g7h8',
  })
  @IsString()
  @IsOptional()
  token?: string;

  @ApiProperty({
    description: 'New password (min 8 characters)',
    example: 'MyNewSecurePass1',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  newPassword: string;
}
