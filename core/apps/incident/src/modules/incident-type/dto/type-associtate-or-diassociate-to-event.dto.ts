import { Type } from 'class-transformer';
import { IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class TypeAssocitateOrDisassociateToEventDto extends EventIdQueryDto {
  @ApiProperty({
    description: 'Array of Incident Type Id',
  })
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  incident_type_ids: number[];
}
