import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateProductDto {
  @IsOptional()
  @IsString()
  _tempId?: string;
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsNumber()
  @IsNotEmpty()
  costPrice: number;

  @IsNumber()
  @IsOptional()
  stock?: number;

  @IsString()
  @IsOptional()
  barCode?: string;

  @IsString()
  @IsOptional()
  productImage?: string;

  @IsNumber()
  @IsOptional()
  lowStockThreshold?: number;
}
