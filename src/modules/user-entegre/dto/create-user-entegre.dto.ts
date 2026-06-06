import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

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

export class CreateUserEntegreDto {
  @IsOptional()
  @IsString()
  entegrasyonKanal?: string;

  @IsOptional()
  @Transform(({ value, obj, key }) => {
    const rawValue = obj?.[key as string];
    return parseBooleanFromRaw(rawValue ?? value);
  })
  @IsBoolean()
  status?: boolean;

  @IsOptional()
  @Transform(({ value, obj, key }) => {
    const rawValue = obj?.[key as string];
    return parseBooleanFromRaw(rawValue ?? value);
  })
  @IsBoolean()
  urunSync?: boolean;

  @IsOptional()
  @Transform(({ value, obj, key }) => {
    const rawValue = obj?.[key as string];
    return parseBooleanFromRaw(rawValue ?? value);
  })
  @IsBoolean()
  stockSync?: boolean;

  @IsOptional()
  @IsDateString()
  subscribed_at?: string;

  @IsOptional()
  @IsDateString()
  expires_at?: string;

  @IsOptional()
  @IsObject()
  apiSettings?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  apiData?: Record<string, unknown>;
}
