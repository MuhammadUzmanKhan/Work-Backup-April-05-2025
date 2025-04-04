import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { CsvOrPdfDto, EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { IsArray } from 'class-validator';

export class SelectedUsersCsvDto extends IntersectionType(
  EventIdQueryDto,
  CsvOrPdfDto,
) {
  @ApiProperty({
    description: 'Mention comma separated user_ids: Ex: 1,2,4',
  })
  @IsArray()
  user_ids: number[];
}
