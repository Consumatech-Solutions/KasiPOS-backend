import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStoreDto {
    @ApiProperty({ example: 'My Awesome Store', description: 'Store name' })
    @IsString()
    name: string;

    @ApiProperty({ example: '123456789', description: 'VAT number', required: false })
    @IsString()
    @IsOptional()
    vatNumber?: string;

    @ApiProperty({ example: 'New creation header', description: 'Receipt header text', required: false })
    @IsString()
    @IsOptional()
    receiptHeader?: string;

    @ApiProperty({ example: 'Thank you for shopping', description: 'Receipt footer text', required: false })
    @IsString()
    @IsOptional()
    receiptFooter?: string;

    // ownerId is taken from the logged-in user
}
