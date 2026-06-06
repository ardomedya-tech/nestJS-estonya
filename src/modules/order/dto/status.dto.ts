import { IsOptional, IsString } from 'class-validator';

export class StatusDto {
  @IsOptional()
  @IsString()
  siparisStatus!: string;

  @IsOptional()
  @IsString()
  kargoStatus!: string;

  @IsOptional()
  @IsString()
  faturaStatus!: string;
}
