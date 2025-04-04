import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, IsString, Length } from 'class-validator';

export class CreatePinDto {
  @ApiProperty()
  @IsNumberString({}, { message: 'Cell must be numeric only' })
  @Length(7, 20, { message: 'Cell must be between 7 and 20 characters long' })
  cell: string;

  @ApiProperty()
  @IsString()
  country_code: string;
}
