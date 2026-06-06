import { IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
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

export class CreateProductDto {
	
	@IsString()
	name!: string;
 
	@IsOptional()
	@IsString()
	altname?: string;

	@IsOptional()
	@IsString()
	faturaName?: string;

	@IsOptional()
	@IsString()
	category?: string;

	@IsOptional()
	@IsString()
	urunKodu?: string;

	@IsOptional()
	@IsString()
	stokKodu?: string;

	@IsOptional()
	@IsString()
	barkod?: string;

	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	satisFiyati?: number;

	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	listeFiyati?: number;

	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	alisFiyati?: number;

	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	kdv?: number;

	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	hazirlikSuresi?: number;
	
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0)
	stock?: number;

	@IsOptional()
	@IsString()
	content?: string;

	@IsOptional()
	@Transform(({ value }) => {
		if (Array.isArray(value)) return value;
		if (typeof value !== 'string') return value;

		const trimmed = value.trim();
		if (!trimmed) return [];

		if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
			try {
				const parsed = JSON.parse(trimmed);
				return Array.isArray(parsed) ? parsed : value;
			} catch {
				return value;
			}
		}

		return trimmed.split(',').map((item: string) => item.trim()).filter(Boolean);
	})
	@IsArray()
	@IsString({ each: true })
	tags?: string[];

	@IsOptional()
	@Transform(({ value, obj, key }) => {
		const rawValue = obj?.[key as string];
		return parseBooleanFromRaw(rawValue ?? value);
	})
	@IsBoolean()
	salesOpen?: boolean;
	
}
