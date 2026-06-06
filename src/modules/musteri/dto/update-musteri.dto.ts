import { PartialType } from '@nestjs/mapped-types';
import { CreateMusteriDto } from './create-musteri.dto';

export class UpdateMusteriDto extends PartialType(CreateMusteriDto) {}
