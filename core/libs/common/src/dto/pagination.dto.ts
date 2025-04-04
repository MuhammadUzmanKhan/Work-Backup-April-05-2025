import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Page Number',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page: number;

  @ApiPropertyOptional({
    description: 'No of records in page',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page_size: number;
}
