import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { LiveVideoTokenRole } from '@Common/constants';

export class GenerateTokenDto {
  @IsString()
  channel_name: string;

  @IsOptional()
  @IsNumber()
  uid: number;

  @IsEnum(LiveVideoTokenRole)
  role: LiveVideoTokenRole;
}
