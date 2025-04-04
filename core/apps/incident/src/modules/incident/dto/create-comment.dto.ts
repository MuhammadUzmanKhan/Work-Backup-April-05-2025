import { IsNumber, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsNumber()
  incident_id!: number;

  @IsString()
  text!: string;
}
