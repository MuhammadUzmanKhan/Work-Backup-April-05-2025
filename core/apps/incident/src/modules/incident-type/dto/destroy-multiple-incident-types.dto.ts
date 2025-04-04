import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class DestroyMultipleIncidentTypesDto extends EventIdQueryDto {
  @ApiProperty({ description: 'List of Source IDs' })
  @IsArray()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  incident_type_ids: number[];
}
