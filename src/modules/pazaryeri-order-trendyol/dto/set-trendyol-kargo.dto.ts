import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class SetTrendyolKargoDto {
  @IsOptional()
  @IsString()
  kargoFirma?: string;

  @IsOptional()
  @IsBoolean()
  aliciOder?: boolean;
}
