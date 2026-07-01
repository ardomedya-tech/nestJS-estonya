import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePazaryeriProductDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  entegreKanalId?: number;

  @IsString()
  pazaryeriName!: string;

  @IsOptional()
  @IsString()
  pazaryeriProductId?: string;

  @IsOptional()
  @IsString()
  pazaryeriSku?: string;

  @IsOptional()
  @IsString()
  pazaryeriBarcode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lastPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  lastStock?: number;
}
