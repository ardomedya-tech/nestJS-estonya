import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateMusteriDto {
  @IsString()
  adsoyad!: string;

  @IsOptional()
  @IsString()
  adres?: string;

  @IsOptional()
  @IsString()
  sehir?: string;

  @IsOptional()
  @IsString()
  ilce?: string;

  @IsOptional()
  @IsString()
  postakodu?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  tckimlik?: string;

  @IsOptional()
  @IsString()
  vergino?: string;

  @IsOptional()
  @IsString()
  vergidaire?: string;

  @IsOptional()
  @IsString()
  firma?: string;

  @IsOptional()
  @IsString()
  tipi?: string;
}
