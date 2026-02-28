import { IsString, IsOptional, IsEnum, IsUUID, IsEmail, ValidateNested, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { StoreStatus } from '../entities/store.entity';

class EnabledModulesDto {
    @ApiProperty({ example: false, description: 'Enable group buying module' })
    @IsBoolean()
    groupbuying: boolean;

    @ApiProperty({ example: false, description: 'Enable marketplace module' })
    @IsBoolean()
    marketplace: boolean;

    @ApiProperty({ example: false, description: 'Enable BOPH module' })
    @IsBoolean()
    boph: boolean;

    @ApiProperty({ example: false, description: 'Enable campaigns module' })
    @IsBoolean()
    campaigns: boolean;

    @ApiProperty({ example: false, description: 'Enable buy stock module' })
    @IsBoolean()
    buyStock: boolean;

    @ApiProperty({ example: false, description: 'Enable show VAT in checkout module' })
    @IsBoolean()
    showVatInCheckout: boolean;
}

class TradingHourSlotDto {
    @ApiPropertyOptional({ example: '08:00', description: 'Opening time (HH:mm format)' })
    @IsString()
    @IsOptional()
    start: string | null;

    @ApiPropertyOptional({ example: '17:00', description: 'Closing time (HH:mm format)' })
    @IsString()
    @IsOptional()
    end: string | null;
}

class TradingHoursDto {
    @ApiProperty({ type: TradingHourSlotDto })
    @ValidateNested()
    @Type(() => TradingHourSlotDto)
    monday: TradingHourSlotDto;

    @ApiProperty({ type: TradingHourSlotDto })
    @ValidateNested()
    @Type(() => TradingHourSlotDto)
    tuesday: TradingHourSlotDto;

    @ApiProperty({ type: TradingHourSlotDto })
    @ValidateNested()
    @Type(() => TradingHourSlotDto)
    wednesday: TradingHourSlotDto;

    @ApiProperty({ type: TradingHourSlotDto })
    @ValidateNested()
    @Type(() => TradingHourSlotDto)
    thursday: TradingHourSlotDto;

    @ApiProperty({ type: TradingHourSlotDto })
    @ValidateNested()
    @Type(() => TradingHourSlotDto)
    friday: TradingHourSlotDto;

    @ApiProperty({ type: TradingHourSlotDto })
    @ValidateNested()
    @Type(() => TradingHourSlotDto)
    saturday: TradingHourSlotDto;

    @ApiProperty({ type: TradingHourSlotDto })
    @ValidateNested()
    @Type(() => TradingHourSlotDto)
    sunday: TradingHourSlotDto;
}

export class AdminCreateStoreDto {
    @ApiProperty({ example: 'My Store', description: 'Store name' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ example: '123456789', description: 'VAT number' })
    @IsString()
    @IsOptional()
    vatNumber?: string;

    @ApiPropertyOptional({ example: 'uuid-here', description: 'User ID of the store admin (owner). If provided, this user becomes the store owner; if omitted, leave empty and assign later via assign-store.' })
    @IsUUID()
    @IsOptional()
    ownerId?: string;

    @ApiPropertyOptional({ example: 'uuid-here', description: 'Client ID' })
    @IsUUID()
    @IsOptional()
    clientId?: string;

    @ApiPropertyOptional({ example: '0812345678', description: 'Contact phone number' })
    @IsString()
    @IsOptional()
    contactNumber?: string;

    @ApiPropertyOptional({ enum: StoreStatus, example: StoreStatus.ACTIVE, description: 'Initial status' })
    @IsEnum(StoreStatus)
    @IsOptional()
    initialStatus?: StoreStatus;

    @ApiPropertyOptional({ example: '123 Main Street, Johannesburg', description: 'Physical address' })
    @IsString()
    @IsOptional()
    address?: string;

    @ApiPropertyOptional({ example: '-26.2041', description: 'Latitude coordinate' })
    @IsString()
    @IsOptional()
    latitude?: string;

    @ApiPropertyOptional({ example: '28.0473', description: 'Longitude coordinate' })
    @IsString()
    @IsOptional()
    longitude?: string;

    @ApiPropertyOptional({ type: EnabledModulesDto, description: 'Enabled modules configuration' })
    @ValidateNested()
    @Type(() => EnabledModulesDto)
    @IsOptional()
    enabledModules?: EnabledModulesDto;

    @ApiPropertyOptional({ type: TradingHoursDto, description: 'Trading hours for each day of the week' })
    @ValidateNested()
    @Type(() => TradingHoursDto)
    @IsOptional()
    tradingHours?: TradingHoursDto;
}
