import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsArray, IsEnum, IsOptional, IsNotEmpty } from "class-validator";
import { PORTFOLIO_TYPE } from "src/common/constants/portfolio_type";
import { Source } from "src/types/enum";

export class PortfolioDto {

  @ApiProperty({
    enum: PORTFOLIO_TYPE,
    enumName: 'portfolioType',
    description: 'This is a required property to create a portfolio.',
    default: PORTFOLIO_TYPE.CASE_STUDY,
  })
  @IsEnum(PORTFOLIO_TYPE, { each: true })
  type: PORTFOLIO_TYPE;

  @ApiProperty({
    type: String,
    description: 'The portfolio name. This is a required property to create a Link',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    type: String,
    description: 'The portfolio description. This is an optional property to create a Link',
  })
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({
    type: [Object],
    description: 'Links related to a portfolio. This is an optional property to create a Link',
  })
  @IsArray()
  @IsOptional()
  links: { title: string, url: string }[];

  @ApiProperty({
    type: [Object],
    description: 'Tags related to a portfolio. This is an optional property to create a Link',
  })
  @IsArray()
  @IsOptional()
  tags: { id: string, name: string, source: Source }[];
}
