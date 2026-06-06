import { Type } from 'class-transformer';
import { IsInt, IsString } from 'class-validator';

export class ImageDeleteDto {
	@Type(() => Number)
	@IsInt()
	productId!: number;

	@IsString()
	image!: string;
}
