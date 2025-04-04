import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class CreateTaskListDto extends EventIdQueryDto {
  @ApiProperty({ description: 'Name of Task List' })
  @IsString()
  @Length(3, 100)
  name: string;
}
