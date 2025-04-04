import { IsNotEmpty, IsString } from 'class-validator';
import { CompanyIdDto } from '@ontrack-tech-group/common/dto';

export class CreateVendorPositionDto extends CompanyIdDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}
