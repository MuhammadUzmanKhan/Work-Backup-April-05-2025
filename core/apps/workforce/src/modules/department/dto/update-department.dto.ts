import { IsNotEmpty, IsString } from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class UpdateDepartmentDto extends EventIdQueryDto {
  @IsString()
  @IsNotEmpty({ message: 'Name should not be empty' })
  name: string;
}
