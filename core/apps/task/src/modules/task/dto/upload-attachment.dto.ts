import { IsNumber, IsString, IsUrl } from 'class-validator';

export class UploadAttachmentDto {
  @IsNumber()
  task_id: number;

  @IsUrl()
  url: string;

  @IsString()
  name: string;
}
