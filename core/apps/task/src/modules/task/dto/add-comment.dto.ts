import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class AddCommentDto {
  @IsString()
  text: string;

  @IsNumber()
  task_id: number;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  user_ids: number[];
}
