import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ProductDto } from './product-dto.dto';

function parseBooleanFromRaw(value: unknown): unknown {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
  }
  return value;
}



export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductDto)
  products!: ProductDto[];

  @IsOptional()
  entegreKanalId?: number;

  @IsOptional()
  @IsString()
  siparisStatus?: string;

  @IsOptional()
  @IsString()
  faturaStatus?: string;

  @IsOptional()
  @IsString()
  kargoStatus?: string;

  @IsOptional()
  @IsString()
  not?: string;

  @IsOptional()
  faturaAdresi?: Record<string, any>;

  @IsOptional()
  siparisAdresi?: Record<string, any>;

  @IsOptional()
  kargoJSON?: Record<string, any>;

  @IsOptional()
  @IsDateString()
  tarih?: string;

  @IsOptional()
  @Transform(({ value, obj, key }) => {
    const rawValue = obj?.[key as string];
    return parseBooleanFromRaw(rawValue ?? value);
  })
  @IsBoolean()
  gelirGoster?: boolean;

  @IsOptional()
  @Transform(({ value, obj, key }) => {
    const rawValue = obj?.[key as string];
    return parseBooleanFromRaw(rawValue ?? value);
  })
  @IsBoolean()
  internetSatisi?: boolean;
}
