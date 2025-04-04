import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class PathParamIdDto {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  @Min(1, { message: 'Path Param ID must be greater than 0' })
  id: number;
}

export class PathParamIncidentIdDto {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  @Min(1, { message: 'Path Param ID must be greater than 0' })
  incident_id: number;
}
