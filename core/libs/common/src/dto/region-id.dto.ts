import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsIn } from 'class-validator';

export class RegionIdDto {
  @ApiPropertyOptional({
    description: `Filter events/companies based on Regions. The structure is [ID - Region Name - Parent ID]. 
      The available regions are: 
      1 - Europe, 
      2 - North America, 
      3 - Asia Pacific, 
      4 - Central America, 
      5 - South America, 
      19 - Middle East, 
      20 - Africa, 
      6 - South East (Parent ID: 2), 
      7 - South (Parent ID: 2), 
      8 - Mid Atlantic (Parent ID: 2), 
      9 - West (Parent ID: 2), 
      10 - Mid West (Parent ID: 2), 
      11 - North East (Parent ID: 2), 
      12 - California (Parent ID: 2), 
      13 - Canada (Parent ID: 2), 
      14 - UK (Parent ID: 1), 
      15 - Ireland (Parent ID: 1), 
      16 - Netherlands (Parent ID: 1), 
      17 - Belgium (Parent ID: 1), 
      18 - Denmark (Parent ID: 1).`,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  @IsIn(
    [1, 2, 3, 4, 5, 19, 20, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    { each: true },
  )
  region_ids: number[];
}
