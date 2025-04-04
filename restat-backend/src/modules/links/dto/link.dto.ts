import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";
import { IsUrl } from "sequelize-typescript";

export class LinkDto {
  
  @ApiProperty({
    type: String,
    description: 'The portfolio name. This is a required property to create a Link',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    type: String,
    description: 'The portfolio description. This is a required property to create a Link',
  })
  @IsString()
  @IsUrl
  url: string;
}
