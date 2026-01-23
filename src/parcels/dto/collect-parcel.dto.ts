import { IsString, MinLength } from 'class-validator';

export class CollectParcelDto {
  @IsString()
  collectionCode: string;

  @IsString()
  @MinLength(2)
  collectingPersonName: string;

  @IsString()
  @MinLength(5)
  collectingPersonId: string;

  @IsString()
  collectingPersonPhone?: string;
}
