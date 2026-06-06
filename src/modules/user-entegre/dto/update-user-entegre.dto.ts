import { PartialType } from '@nestjs/mapped-types';
import { CreateUserEntegreDto } from './create-user-entegre.dto';

export class UpdateUserEntegreDto extends PartialType(CreateUserEntegreDto) {}
