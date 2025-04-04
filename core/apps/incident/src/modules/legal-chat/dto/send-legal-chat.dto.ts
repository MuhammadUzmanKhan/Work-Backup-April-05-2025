import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  IsNumber,
  ValidateIf,
} from 'class-validator';

export class SendLegalMessageDto {
  @IsNumber()
  incident_id: number;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsBoolean()
  @IsOptional()
  is_attachment: boolean;

  @ValidateIf((o) => o.is_attachment === true)
  @IsString()
  @IsNotEmpty()
  attachment_name: string;
}
