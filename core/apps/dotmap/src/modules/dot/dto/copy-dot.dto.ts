import { ArrayNotEmpty, IsArray, IsString, Matches } from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class CopyDotDto extends EventIdQueryDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'Dates should not be empty' })
  @IsString({ each: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date is not valid or not in the correct format yyyy-mm-dd',
    each: true,
  })
  dates: string[];
}
