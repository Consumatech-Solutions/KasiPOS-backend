import { PartialType } from '@nestjs/swagger';
import { AdminCreateStoreDto } from './admin-create-store.dto';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdminUpdateStoreDto extends PartialType(AdminCreateStoreDto) {
    @ApiPropertyOptional({ example: 'https://example.com/logo.png', description: 'Store logo URL' })
    @IsString()
    @IsOptional()
    logoUrl?: string;

    @ApiPropertyOptional({ example: 'Welcome header', description: 'Receipt header text' })
    @IsString()
    @IsOptional()
    receiptHeader?: string;

    @ApiPropertyOptional({ example: 'Thank you for shopping', description: 'Receipt footer text' })
    @IsString()
    @IsOptional()
    receiptFooter?: string;

    @ApiPropertyOptional({ example: true, description: 'Is store setup complete' })
    @IsBoolean()
    @IsOptional()
    isSetupComplete?: boolean;
}
