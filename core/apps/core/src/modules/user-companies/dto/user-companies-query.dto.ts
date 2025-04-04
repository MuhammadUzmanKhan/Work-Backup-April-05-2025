import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto } from '@ontrack-tech-group/common/dto';
import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class UserCompaniesQueryDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  user_id: number;
}

export class UserCompaniesChangeLogsDto extends PaginationDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  user_id: number;
}
