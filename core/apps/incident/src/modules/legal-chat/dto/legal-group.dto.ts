import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@ontrack-tech-group/common/dto';
import { IsOptional, IsString } from 'class-validator';

export class GetLegalChatDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search by message text',
  })
  @IsOptional()
  @IsString()
  keyword: string;
}
