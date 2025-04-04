import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class CreateSourceDto extends EventIdQueryDto {
  @ApiProperty({ description: 'Name of Source' })
  @IsString()
  name: string;
}
