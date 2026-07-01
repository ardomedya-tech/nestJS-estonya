import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePazaryeriProductVariantDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pazaryeriProductId!: number;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  productUrl?: string;

  @IsOptional()
  @IsBoolean()
  onSale?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  stock?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  salePrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  listPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  vatRate?: number;

  @IsOptional()
  @IsString()
  title?: string;
}
