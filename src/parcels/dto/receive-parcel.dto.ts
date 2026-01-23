import { IsString } from 'class-validator';

export class ReceiveParcelDto {
  @IsString()
  receiptCode: string;
}
