import { IsString, IsUUID } from 'class-validator';

export class CreateParcelDto {
  @IsUUID()
  storeId: string;

  @IsString()
  deliveryNumber: string;

  @IsString()
  customerName: string;
}
