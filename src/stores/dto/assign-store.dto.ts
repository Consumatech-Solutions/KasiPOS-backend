import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignStoreDto {
  @ApiProperty({
    description: 'Store UUID to assign a store admin to',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  store: string;

  @ApiProperty({
    description: 'Full name of the store admin',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Phone number of the store admin (used for login and SMS)',
    example: '0812345678',
  })
  @IsString()
  @IsNotEmpty()
  number: string;
}
