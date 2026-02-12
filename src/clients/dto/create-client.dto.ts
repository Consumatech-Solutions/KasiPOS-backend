import { IsString, IsNotEmpty, IsOptional, IsEnum, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClientType } from '../entities/client.entity';

export class CreateClientDto {
  @ApiProperty({
    description: 'Client name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Client type',
    enum: ClientType,
    example: ClientType.INDIVIDUAL,
  })
  @IsEnum(ClientType)
  @IsNotEmpty()
  type: ClientType;

  @ApiPropertyOptional({
    description: 'Client ID number (ID, passport, company registration, etc.)',
    example: '9001015800080',
  })
  @IsString()
  @IsOptional()
  idNumber?: string;

  @ApiPropertyOptional({
    description: 'Physical address of the client',
    example: '123 Main Street, Johannesburg, 2000',
  })
  @IsString()
  @IsOptional()
  physicalAddress?: string;

  @ApiPropertyOptional({
    description: 'Contact phone number',
    example: '0812345678',
  })
  @IsString()
  @IsOptional()
  contactNumber?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;
}
