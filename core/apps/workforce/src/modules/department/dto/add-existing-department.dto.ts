import { IsArray, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class DepartmentAssocitateOrDisassociateToEventDto {
  @ApiProperty({ description: 'Event id' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  event_id: number;

  @ApiProperty({
    description: 'Array of Incident Division Id',
  })
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  department_ids: number[];
}

export class DisassociateDepartmentDto extends EventIdQueryDto {
  @ApiProperty()
  @IsArray()
  department_ids: number[];
}
