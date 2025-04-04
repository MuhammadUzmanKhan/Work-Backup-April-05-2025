import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class GetIncidentMessagesDto extends EventIdQueryDto {
  @ApiProperty()
  @IsString()
  from_number: number;

  @ApiProperty()
  @IsString()
  to_number: number;
}
