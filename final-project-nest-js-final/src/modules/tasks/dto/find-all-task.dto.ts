import { IsOptional, IsString, IsNumber, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export class FindAllTaskDto {
  @IsOptional()
  @IsString()
  keyword: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Transform(
    ({ value }) => {
      if (typeof value === 'string' || typeof value === 'number') {
        return [Number(value)];
      } else if (Array.isArray(value)) {
        return value.map(Number);
      }
      return [];
    },
    { toClassOnly: true },
  )
  readonly userId?: number[];
}
