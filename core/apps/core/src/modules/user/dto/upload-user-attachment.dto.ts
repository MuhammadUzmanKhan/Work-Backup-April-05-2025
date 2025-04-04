import { IsNumber, IsString, IsUrl } from 'class-validator';

export class UploadUserAttachmentDto {
  @IsNumber()
  user_id: string;

  @IsUrl()
  url: string;

  @IsString()
  name: string;
}
