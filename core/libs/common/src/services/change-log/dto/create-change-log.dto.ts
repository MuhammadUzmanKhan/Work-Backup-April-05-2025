import { EventStatus, PolymorphicType } from '../../../constants';
import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateChangeLogDto {
  @IsNumber()
  id: number;

  @IsString()
  type: PolymorphicType;

  @IsString()
  column: string;

  @IsString()
  formatted_log_text: string;

  @IsNumber()
  editor_id: number;

  @IsString()
  editor_type: string;

  @IsOptional()
  @IsString()
  old_value: string | EventStatus;

  @IsOptional()
  @IsString()
  new_value: string;

  @IsOptional()
  @IsString()
  commented_by: string;

  @IsOptional()
  @IsObject()
  additional_values: Record<string, any>;
}
