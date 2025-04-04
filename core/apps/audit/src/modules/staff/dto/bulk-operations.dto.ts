import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  ArrayNotEmpty,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class StaffIdsDto {
  @IsArray() // Validate that it's an array
  @ArrayNotEmpty() // Ensure the array is not empty
  @Type(() => Number) // Transform each element to a number
  @IsNumber({}, { each: true }) // Validate that each element in the array is a number
  staff_ids!: number[];
}

export class BulkStaffUpdateDto extends StaffIdsDto {
  @IsBoolean({
    message: 'The "priority" field must be a boolean (true or false).',
  })
  @IsOptional()
  @Type(() => Boolean) // Ensures transformation to boolean
  priority!: boolean;

  @IsBoolean({
    message: 'The "is_flagged" field must be a boolean (true or false).',
  })
  @IsOptional()
  @Type(() => Boolean) // Ensures transformation to boolean
  is_flagged!: boolean;
}
