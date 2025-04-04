import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsEnum } from 'class-validator';
import { PolymorphicType } from '../../../constants';
import { PaginationDto } from '../../../dto';

export class GetChangeLogDto extends PaginationDto {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsEnum(PolymorphicType)
  types: PolymorphicType[];
}
