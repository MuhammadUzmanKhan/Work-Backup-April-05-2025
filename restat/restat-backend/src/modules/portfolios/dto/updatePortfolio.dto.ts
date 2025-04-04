import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsArray, IsOptional } from "class-validator";
import { Source } from "src/types/enum";

export class UpdatePortfolioDto {
  @ApiProperty({
    type: String,
    description: 'The portfolio id.',
  })
  @IsString()
  id: string;


  @ApiProperty({
    type: String,
    description: 'The portfolio name.',
  })
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty({
    type: String,
    description: 'The portfolio description.',
  })
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({
    type: [Object],
    description: 'Links related to a portfolio.',
  })
  @IsArray()
  @IsOptional()
  links: { title: string, url: string }[];

  @ApiProperty({
    type: [Object],
    description: 'Tags related to a portfolio.',
  })
  @IsArray()
  @IsOptional()
  tags: { id: string, name: string, source: Source }[];
}
