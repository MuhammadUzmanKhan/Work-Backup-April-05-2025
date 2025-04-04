import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import {
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
} from '@nestjs/swagger';
import { EventIdQueryDto, PaginationDto } from '@ontrack-tech-group/common/dto';
import { SortBy } from '@ontrack-tech-group/common/constants';

export class GetIncidentConversationDto extends IntersectionType(
  EventIdQueryDto,
  PaginationDto,
) {
  @ApiProperty()
  @IsString()
  phone_number: string;

  @ApiPropertyOptional({
    description: 'Search by sender name, text and sender phone number',
  })
  @IsString()
  @IsOptional()
  keyword: string;

  @ApiPropertyOptional({
    description: 'Pass true to get archived incident Conversations',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  archived: boolean;

  @ApiPropertyOptional({
    description: 'Pass true for return unread conversations',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  unread: boolean;

  @ApiPropertyOptional({
    description: 'Pass true for return pinnded conversations',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  pinned: boolean;

  @ApiPropertyOptional({
    description: 'Pass true for return concluded conversations',
  })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  concluded: boolean;

  @ApiPropertyOptional({ description: 'Order must be ASC or DESC' })
  @IsOptional()
  @IsEnum(SortBy)
  order: SortBy;
}
