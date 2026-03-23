import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NewStoreAdminDto {
  @ApiPropertyOptional({ description: 'Existing user ID to promote to store admin' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Required with number if userId is omitted' })
  @ValidateIf((o) => !o.userId)
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ description: 'Required with name if userId is omitted' })
  @ValidateIf((o) => !o.userId)
  @IsString()
  @IsNotEmpty()
  number?: string;
}

export class ChangeStoreAdminDto {
  @ApiProperty({ description: 'Store UUID' })
  @IsUUID()
  store: string;

  @ApiProperty({ type: NewStoreAdminDto })
  @ValidateNested()
  @Type(() => NewStoreAdminDto)
  newStoreAdmin: NewStoreAdminDto;
}
