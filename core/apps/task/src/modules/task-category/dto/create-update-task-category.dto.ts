import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CompanyIdDto } from '@ontrack-tech-group/common/dto';

export class CreateUpdateTaskCategoryDto extends CompanyIdDto {
  @ApiProperty({ description: 'Name of Task Category' })
  @IsString()
  @Length(3, 100)
  name: string;
}
