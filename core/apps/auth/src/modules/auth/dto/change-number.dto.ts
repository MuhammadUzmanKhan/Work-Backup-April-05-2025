import { IsNumberString, IsString, Length } from 'class-validator';
import { Match } from '@ontrack-tech-group/common/decorators';

export class ChangeNumberDto {
  @IsString()
  old_cell: string;

  @IsString()
  old_country_code: string;

  @IsNumberString({}, { message: 'Cell must be numeric only' })
  @Length(7, 20, { message: 'Cell must be between 7 and 20 characters long' })
  new_cell: string;

  @IsString()
  new_country_code: string;

  @IsString()
  @Match('new_cell', { message: 'Confirm cell is not matched to new cell.' })
  confirm_new_cell: string;

  @IsString()
  @Match('new_country_code', {
    message: 'Confirm country code is not matched to new country code.',
  })
  confirm_new_country_code: string;
}
