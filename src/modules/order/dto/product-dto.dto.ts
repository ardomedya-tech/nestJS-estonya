import {
  IsString,
  IsNumber,
} from 'class-validator';

export class ProductDto {
  @IsNumber()
  id!: number;

  @IsString()
  name!: string;

  @IsString()
  urunKodu!: string;

  @IsString()
  barkod!: string;

  @IsNumber()
  satisFiyati!: number;

  @IsNumber()
  kdvHaricFiyati!: number;

  @IsNumber()
  alisFiyati!: number;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  kdv!: number;

  @IsNumber()
  stock!: number;
}