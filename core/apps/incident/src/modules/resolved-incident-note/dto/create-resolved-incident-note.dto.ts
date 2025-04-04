import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ResolvedIncidentNoteStatusApi } from '@ontrack-tech-group/common/constants';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class CreateResolvedIncidentNoteDto extends EventIdQueryDto {
  @Type(() => Number)
  @IsNumber()
  incident_id: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  affected_person: number;

  @IsOptional()
  @IsString()
  note: string;

  @IsEnum(ResolvedIncidentNoteStatusApi)
  status: ResolvedIncidentNoteStatusApi;
}
