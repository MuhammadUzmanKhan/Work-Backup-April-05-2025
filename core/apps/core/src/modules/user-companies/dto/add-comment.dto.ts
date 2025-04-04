import { Type } from 'class-transformer';
import { IsNumber, IsString, Min } from 'class-validator';

export class AddCommentDto {
  @IsString()
  text: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  user_id: number;
}
