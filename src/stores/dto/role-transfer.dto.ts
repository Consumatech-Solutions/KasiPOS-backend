import { IsIn, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RoleTransferDto {
  @ApiProperty({ description: 'User ID of the staff member who will become store admin and store owner' })
  @IsUUID()
  newStoreAdminId: string;

  @ApiProperty({
    description: 'What happens to the current store admin after transfer',
    enum: ['deleted', 'staff user'],
    example: 'staff user',
  })
  @IsIn(['deleted', 'staff user'], {
    message: 'oldStoreAdminState must be "deleted" or "staff user"',
  })
  oldStoreAdminState: 'deleted' | 'staff user';
}
