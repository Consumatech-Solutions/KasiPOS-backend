import { ApiProperty } from '@nestjs/swagger';

export class IndexFileResponseDto {
  @ApiProperty({ example: 42 })
  indexed: number;
}
