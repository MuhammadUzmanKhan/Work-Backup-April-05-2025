import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotIn, IsNumber, IsOptional, ValidateIf } from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class RemoveBulkStaffDto extends EventIdQueryDto {
  @IsNumber()
  @Type(() => Number)
  vendor_id!: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  shift_id!: number;
}

export class AddRemoveStaffDto extends EventIdQueryDto {
  @ApiProperty({
    description:
      'Add staff quantity to delete. Positive requires rate; negative must not have rate. Zero is not allowed.',
  })
  @IsNumber()
  @IsNotIn([0], { message: 'Quantity must not be zero.' })
  @Type(() => Number)
  quantity!: number;

  @ApiProperty({
    description: 'Staff rate. Required if quantity is positive.',
  })
  @IsNumber()
  @Type(() => Number)
  @ValidateIf((attr) => attr.quantity > 0)
  rate!: number;

  @ApiProperty({
    description: 'Add vendor ID.',
  })
  @IsNumber()
  @Type(() => Number)
  vendor_id!: number;

  @ApiProperty({
    description: 'Add shift ID.',
  })
  @IsNumber()
  @Type(() => Number)
  shift_id!: number;

  @ApiProperty({
    description: 'Add position ID.',
  })
  @IsNumber()
  @Type(() => Number)
  position_id!: number;
}
