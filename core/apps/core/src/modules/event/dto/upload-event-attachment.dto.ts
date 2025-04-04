import { IsString, IsUrl, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class UploadEventAttachmentDto extends EventIdQueryDto {
  @ApiProperty()
  @IsUrl()
  url: string;

  @ApiProperty()
  @Length(3, 50)
  @IsString()
  name: string;
}
