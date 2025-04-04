import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class DatesQueryDto {
  @ApiPropertyOptional({
    example: ['2024-05-23', '2024-05-24'],
    description:
      'Pass Multiple dates. FORMAT -> YYYY-MM-DD like dates=2024-10-10&dates=2024-10-11',
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) =>
    Array.isArray(value) ? value : typeof value === 'string' ? [value] : [],
  )
  @IsString({ each: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    each: true,
    message: 'Dates must be in YYYY-MM-DD format',
  })
  dates?: string[];
}
