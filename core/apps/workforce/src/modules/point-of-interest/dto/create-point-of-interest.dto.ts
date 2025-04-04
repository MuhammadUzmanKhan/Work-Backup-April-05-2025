import { ApiProperty } from '@nestjs/swagger';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { Type } from 'class-transformer';
import { IsNumber, IsString, Min } from 'class-validator';

export class CreatePointOfInterestDto extends EventIdQueryDto {
  @ApiProperty({ description: 'Name of Point of Interest Type' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Latitude of Point of Interest' })
  @IsString()
  latitude: string;

  @ApiProperty({ description: 'Longitude of Point of Interest' })
  @IsString()
  longitude: string;

  @ApiProperty({ description: 'Point of Interest Type Id' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  poi_type_id: number;
}
