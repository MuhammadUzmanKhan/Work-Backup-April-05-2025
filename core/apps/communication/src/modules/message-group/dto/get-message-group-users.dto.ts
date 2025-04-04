import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { EventIdQueryDto, PaginationDto } from '@ontrack-tech-group/common/dto';

export class GetMessageGroupUser extends IntersectionType(
  PaginationDto,
  EventIdQueryDto,
) {
  @ApiPropertyOptional({
    description: 'Keyword is used to Search User by Name',
  })
  @IsOptional()
  @IsString()
  keyword: string;
}
