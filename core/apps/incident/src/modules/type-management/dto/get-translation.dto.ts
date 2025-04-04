import { IsString } from 'class-validator';
import { CompanyIdDto } from '@ontrack-tech-group/common/dto';
import { ApiProperty } from '@nestjs/swagger';

export class GetTranslationsDto extends CompanyIdDto {
  @ApiProperty({
    description: 'Pass String to trnaslate in sub-companies default language',
  })
  @IsString()
  name: string;
}
