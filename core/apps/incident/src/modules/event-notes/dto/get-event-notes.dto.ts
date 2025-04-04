import { IsISO8601, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { CsvOrPdfDto, EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class GetAllEventNotesDto extends IntersectionType(
  EventIdQueryDto,
  CsvOrPdfDto,
) {
  @ApiPropertyOptional({ description: 'Pass the date to get event notes' })
  @IsOptional()
  @IsString()
  @IsISO8601()
  filter_by_date: string;

  @ApiPropertyOptional({ description: 'Pass the start_date' })
  @IsOptional()
  @IsString()
  @IsISO8601()
  start_date: string;

  @ApiPropertyOptional({ description: 'Pass the end_date' })
  @IsOptional()
  @IsString()
  @IsISO8601()
  end_date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword: string;
}
