import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class UpdateIncidentDivisionDto extends EventIdQueryDto {
  @ApiProperty({ description: 'Incident division name' })
  @IsString()
  @IsNotEmpty({ message: 'Name should not be empty' })
  name: string;
}
