import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import {
  CompanyIdOptionalDto,
  EventIdQueryOptionalDto,
} from '@ontrack-tech-group/common/dto';

export class CreateDepartmentDto extends IntersectionType(
  EventIdQueryOptionalDto,
  CompanyIdOptionalDto,
) {
  @ApiProperty()
  @MaxLength(100)
  @IsString()
  name: string;

  @ApiProperty()
  @IsOptional()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  contact_person: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  phone: string;
}
