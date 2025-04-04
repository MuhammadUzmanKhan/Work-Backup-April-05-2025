import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class UploadIncidentTypesDto extends EventIdQueryDto {
  @ApiProperty()
  @IsString()
  file: string;
}
