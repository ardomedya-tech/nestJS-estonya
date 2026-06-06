import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class KargoDto {
  @IsString()
  kargoFirma!: string;

  @IsString()
  kargoTakipNo!: string;

  @IsOptional()
  @IsNumber()
  kargoPrice?: number;

  @IsOptional()
  @IsBoolean()
  aliciOder?: boolean;
}
