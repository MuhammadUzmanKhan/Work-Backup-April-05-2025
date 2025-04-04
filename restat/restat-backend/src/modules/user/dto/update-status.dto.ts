import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import { USERSTATUS } from "src/common/constants/userStatus";

export class UpdateStatusDto {
  @ApiProperty({
    type: String,
    description: 'This is a required property to update the user status.'
  })
  @IsString()
  @IsNotEmpty()
  status: USERSTATUS;
}
