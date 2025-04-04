import { IsEnum, IsNumber, IsString, Length } from 'class-validator';
import { PolymorphicType } from '@ontrack-tech-group/common/constants';

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
