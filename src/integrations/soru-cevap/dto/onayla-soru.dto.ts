import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class OnaylaSoruDto {
  @IsInt()
  @Min(1)
  soruId!: number;

  @IsString()
  @IsIn(['gonderildi', 'reddedildi'])
  durum!: 'gonderildi' | 'reddedildi';

  @IsOptional()
  @IsString()
  duzenlenmisCevap?: string;
}
