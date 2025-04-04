import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class UpdateNameDto {
  @ApiProperty({
    type: String,
    description: 'This is a required property to update the name.'
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}
