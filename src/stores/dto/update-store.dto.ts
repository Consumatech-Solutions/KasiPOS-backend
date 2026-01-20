import { PartialType } from '@nestjs/swagger';
import { CreateStoreDto } from './create-store.dto';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStoreDto extends PartialType(CreateStoreDto) {
    @ApiProperty({ example: 'https://example.com/logo.png', description: 'Store logo URL', required: false })
    @IsString()
    @IsOptional()
    logoUrl?: string;

    @ApiProperty({ example: true, description: 'Is store setup complete', required: false })
    @IsBoolean()
    @IsOptional()
    isSetupComplete?: boolean;
}
