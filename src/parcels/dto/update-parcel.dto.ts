import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ParcelStatus } from '../entities/parcel.entity';

export class UpdateParcelDto {
  @IsOptional()
  @IsString()
  deliveryNumber?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsEnum(ParcelStatus)
  status?: ParcelStatus;

  @IsOptional()
  @IsString()
  collectionCode?: string;

  @IsOptional()
  @IsString()
  receiptCode?: string;

  @IsOptional()
  @IsDateString()
  dateReceived?: string;

  @IsOptional()
  @IsDateString()
  dateCollected?: string;

  @IsOptional()
  @IsString()
  collectingPersonName?: string;

  @IsOptional()
  @IsString()
  collectingPersonPhone?: string;

  @IsOptional()
  @IsString()
  collectingPersonId?: string;
}
