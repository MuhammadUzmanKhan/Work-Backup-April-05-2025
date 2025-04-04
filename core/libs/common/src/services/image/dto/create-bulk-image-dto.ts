import { PolymorphicType } from '../../../constants';
import { IsEnum, IsNumber, IsString, Length } from 'class-validator';

export class CreateBulkImageDto {
  @IsString()
  @Length(3, 50)
  name: string;

  @IsString()
  url: string;

  @IsNumber()
  imageable_id: number;

  @IsEnum(PolymorphicType)
  imageable_type: PolymorphicType;
}
