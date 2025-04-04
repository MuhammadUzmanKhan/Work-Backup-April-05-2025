import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class DivisionAssocitateOrDisassociateToEventDto extends EventIdQueryDto {
  @ApiProperty({
    description: 'Array of Incident Division Id',
  })
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  incident_division_ids: number[];
}
