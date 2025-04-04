import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class CreatePresetMessageDto extends EventIdQueryDto {
  @ApiProperty({ description: 'Pass title of message' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Pass message' })
  @IsString()
  text: string;

  @ApiPropertyOptional({ description: 'Pass Hot Key' })
  @MinLength(2)
  @MaxLength(3)
  @IsOptional()
  @IsString()
  hot_key: string;
}
