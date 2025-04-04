import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMessageDto {
  @ApiProperty()
  @IsString()
  messageBody: string;

  @ApiProperty()
  @IsArray()
  @ValidateNested()
  @Type(() => UserNumbersDto)
  userNumbers: UserNumbersDto[];
}

export class UserNumbersDto {
  @ApiProperty()
  @IsString()
  cell: string;

  @ApiProperty()
  @IsString()
  sender_cell: string;
}
