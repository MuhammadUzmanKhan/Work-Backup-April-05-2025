import { IsString } from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class DeploymentPdfDto extends EventIdQueryDto {
  @IsString()
  filename: string;

  @IsString()
  image_url: string;
}
