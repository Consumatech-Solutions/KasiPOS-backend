import { Type } from 'class-transformer';
import { IsString, IsInt } from 'class-validator';

export class CreateParcelDto {
  @Type(() => Number)
  @IsInt()
  storeId: number;

  @IsString()
  deliveryNumber: string;

  @IsString()
  customerName: string;
}
