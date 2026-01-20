import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestOtpDto {
  @ApiProperty({
    description: 'South African phone number',
    example: '0812345678',
    pattern: '^(\\+27|0)[0-9]{9}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(\+27|0)[0-9]{9}$/, {
    message: 'Phone number must be a valid South African number',
  })
  phone: string;
}
