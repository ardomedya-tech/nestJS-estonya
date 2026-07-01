import { PartialType } from '@nestjs/mapped-types';
import { CreatePazaryeriProductDto } from './create-pazaryeri-product.dto';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

class UpdatePazaryeriProductVariantInputDto {
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	id?: number;

	@IsOptional()
	@IsString()
	barcode?: string;

	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	listPrice?: number;

	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	salePrice?: number;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	stock?: number;

	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	vatRate?: number;
}

export class UpdatePazaryeriProductDto extends PartialType(CreatePazaryeriProductDto) {
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => UpdatePazaryeriProductVariantInputDto)
	variants?: UpdatePazaryeriProductVariantInputDto[];
}
