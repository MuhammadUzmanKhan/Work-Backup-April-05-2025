import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class CreateReferenceMapDto extends EventIdQueryDto {
  @ApiProperty({ description: 'Name of Reference Map' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Base 64 Image Url' })
  @IsString()
  image: string;
}
