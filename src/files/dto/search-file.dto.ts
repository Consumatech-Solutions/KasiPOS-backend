import { ApiProperty } from '@nestjs/swagger';

export class SearchFileRequestDto {
  @ApiProperty({
    example: 'What is photosynthesis?',
    description: 'Natural language query',
  })
  query: string;

  @ApiProperty({
    example: 5,
    required: false,
    description: 'Max number of results',
  })
  limit?: number;
}

export class SearchResultDto {
  @ApiProperty({ example: 'Photosynthesis is ...' })
  content: string;

  @ApiProperty({
    example: 0.92,
    description: 'Similarity score (higher is better)',
  })
  score: number;
}

export class SearchFileResponseDto {
  @ApiProperty({ type: [SearchResultDto] })
  results: SearchResultDto[];
}
