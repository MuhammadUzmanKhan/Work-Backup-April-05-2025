import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class UpdatePresetMessageDto extends EventIdQueryDto {
  @ApiPropertyOptional({ description: 'Pass title of message' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Title should not be empty' })
  title: string;

  @ApiPropertyOptional({ description: 'Pass message' })
  @IsOptional()
  @IsString()
  text: string;

  @ApiPropertyOptional({ description: 'Pass Hot Key' })
  @IsOptional()
  @MinLength(2)
  @MaxLength(3)
  @IsString()
  hot_key: string;

  @ApiPropertyOptional({
    description: 'Pass true or false to enable or diable message',
  })
  @IsOptional()
  @IsBoolean()
  is_enabled: boolean;
}
