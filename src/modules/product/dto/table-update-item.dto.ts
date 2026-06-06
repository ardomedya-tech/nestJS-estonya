import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, Min } from 'class-validator';

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

export class TableUpdateItemDto {
	@Type(() => Number)
	@IsInt()
	id!: number;

	@Type(() => Number)
	@IsNumber()
	satisFiyati!: number;

	@Type(() => Number)
	@IsNumber()
	listeFiyati!: number;

	@Type(() => Number)
	@IsInt()
	@Min(0)
	stock!: number;

	@Transform(({ value, obj, key }) => {
		const rawValue = obj?.[key as string];
		return parseBooleanFromRaw(rawValue ?? value);
	})
	@IsBoolean()
	salesOpen!: boolean;
}
