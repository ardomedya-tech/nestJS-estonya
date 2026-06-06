import { PartialType } from '@nestjs/mapped-types';
import { CreateEntegreKanalDto } from './create-entegre-kanal.dto';

export class UpdateEntegreKanalDto extends PartialType(CreateEntegreKanalDto) {}
