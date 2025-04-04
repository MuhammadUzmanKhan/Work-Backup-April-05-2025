import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class TagDto {
  @ApiProperty({
    type: String,
    description: "This is a required property to create tag.",
  })
  @IsString()
  name: string;
}
