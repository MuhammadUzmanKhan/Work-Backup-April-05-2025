import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class CreateIncidentDivisionDto extends EventIdQueryDto {
  @ApiProperty({ description: 'Incident division name' })
  @IsString()
  name: string;
}
