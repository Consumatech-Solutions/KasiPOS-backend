import { IsString, IsNotEmpty, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class CreateProductDto {
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
}
