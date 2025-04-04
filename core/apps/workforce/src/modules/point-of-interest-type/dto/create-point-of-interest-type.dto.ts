import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreatePointOfInterestTypeDto {
  @ApiProperty({ description: 'Name of Point of Interest Type' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Color of Point of Interest' })
  @IsString()
  color: string;
}
