import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsString } from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class UploadImagesForInventory extends EventIdQueryDto {
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsArray()
  @Type(() => String)
  @IsString({ each: true })
  images: string[];
}
