import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class CronTaraDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  autoSendThreshold?: number;
}
