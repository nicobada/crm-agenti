import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString({ message: 'Lo SKU è obbligatorio' })
  sku!: string;

  @IsString({ message: 'Il nome è obbligatorio' })
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber({}, { message: 'Il prezzo deve essere un numero' })
  @Min(0)
  @Type(() => Number)
  basePrice!: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock?: number;
}

// ✅ FIX: Esportazione esplicita per la modifica
export class UpdateProductDto {
  @IsOptional() @IsString() sku?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) basePrice?: number;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) stock?: number;
}