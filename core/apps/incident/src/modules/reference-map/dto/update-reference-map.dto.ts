import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class UpdateReferenceMapDto extends EventIdQueryDto {
  @ApiPropertyOptional({ description: 'Name of Reference Map' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Name should not be empty' })
  name: string;

  @ApiPropertyOptional({ description: 'Base 64 Image Url' })
  @IsOptional()
  @IsString()
  image: string;
}
