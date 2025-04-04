import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdatePointOfInterestTypeDto {
  @ApiPropertyOptional({ description: 'Name of Point of Interest Type' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Name should not be empty' })
  name: string;

  @ApiPropertyOptional({ description: 'Color of Point of Interest' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Color should not be empty' })
  color: string;
}
