import { PartialType } from '@nestjs/mapped-types';
import { CreateVoucherDto } from './create-voucher.dto';

export class UpdateVoucherDto extends PartialType(CreateVoucherDto) {
  // Code cannot be updated once created
}
