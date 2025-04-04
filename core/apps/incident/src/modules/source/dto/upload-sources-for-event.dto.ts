import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class UploadSourcesForEventDto extends EventIdQueryDto {
  @ApiProperty()
  @IsString()
  file: string;
}
