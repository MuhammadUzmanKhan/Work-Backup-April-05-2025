import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { MessageableType } from '@ontrack-tech-group/common/constants';

export class CreateMessageSQSDto {
  @IsString()
  messageBody: string;

  @IsArray()
  @ValidateNested()
  @Type(() => UserNumbersDto)
  userNumbers: UserNumbersDto[];

  @IsOptional()
  @IsString()
  messageableType?: MessageableType;
}

export class UserNumbersDto {
  @IsString()
  cell: string;

  @IsOptional()
  @IsString()
  sender_cell: string;
}
