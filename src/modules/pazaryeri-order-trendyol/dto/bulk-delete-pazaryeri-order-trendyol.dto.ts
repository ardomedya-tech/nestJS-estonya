import { Transform } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsInt, Min } from 'class-validator';

export class BulkDeletePazaryeriOrderTrendyolDto {
  @IsArray()
  @ArrayNotEmpty()
  @Transform(({ value }) => {
    if (!Array.isArray(value)) {
      return value;
    }

    return value.map((item) => Number(item));
  })
  @IsInt({ each: true })
  @Min(1, { each: true })
  ids!: number[];
}
