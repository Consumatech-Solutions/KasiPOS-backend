import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ClearCreditDto {
  @ApiProperty({
    description: 'Transaction UUID (credit sale) to mark as paid',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  id: string;
}
