import { IsBoolean, IsString, Length } from 'class-validator';

export class CreateInformationRequestDto {
  @IsString()
  @Length(3, 50)
  name: string;

  @IsString()
  email: string;

  @IsString()
  message: string;

  @IsString()
  company: string;

  @IsBoolean()
  get_updates: boolean;
}
