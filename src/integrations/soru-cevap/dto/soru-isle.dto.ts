import { IsInt, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class SoruIsleDto {
  @IsInt()
  @Min(1)
  soruId!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  autoSendThreshold?: number;
}
