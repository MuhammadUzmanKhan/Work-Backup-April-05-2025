import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdatePointOfInterestDto extends EventIdQueryDto {
  @ApiPropertyOptional({ description: 'Name of Point of Interest Type' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Name should not be empty' })
  name: string;

  @ApiPropertyOptional({ description: 'Latitude of Point of Interest' })
  @IsOptional()
  @IsString()
  latitude: string;

  @ApiPropertyOptional({ description: 'Longitude of Point of Interest' })
  @IsOptional()
  @IsString()
  longitude: string;

  @ApiPropertyOptional({ description: 'Point of Interest Type Id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  poi_type_id: number;
}
