import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ResolvedIncidentNoteStatusApi } from '@ontrack-tech-group/common/constants';

export class UpdateResolvedIncidentNoteDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  affected_person: number;

  @IsOptional()
  @IsString()
  note: string;

  @IsOptional()
  @IsEnum(ResolvedIncidentNoteStatusApi)
  status: ResolvedIncidentNoteStatusApi;
}
