import { PartialType } from '@nestjs/mapped-types';
import { CreatePazaryeriProductVariantDto } from './create-pazaryeri-product-variant.dto';

export class UpdatePazaryeriProductVariantDto extends PartialType(CreatePazaryeriProductVariantDto) {}
