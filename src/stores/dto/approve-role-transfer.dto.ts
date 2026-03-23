import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApproveRoleTransferDto {
  @ApiProperty({ description: 'Role transfer request UUID' })
  @IsUUID()
  roleTransferId: string;
}
