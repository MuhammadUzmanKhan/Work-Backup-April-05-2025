import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import { CompanyIdQueryDto } from '@Common/dto';

export class CreateUpdateCadTypeDto extends CompanyIdQueryDto {
  @ApiProperty({ description: 'Name of Cad Type' })
  @IsString()
  @Length(3, 100)
  name: string;
}
