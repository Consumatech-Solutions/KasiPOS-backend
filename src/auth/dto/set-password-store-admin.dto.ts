import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetPasswordStoreAdminDto {
  @ApiProperty({ description: 'Store admin phone number', example: '0812345678' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: 'Temporary password received by SMS', example: 'Ab12Cd34Ef' })
  @IsString()
  @IsNotEmpty()
  temporaryPassword: string;

  @ApiProperty({ description: 'New password (min 8 characters)', example: 'MyNewSecurePass1', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  newPassword: string;
}
