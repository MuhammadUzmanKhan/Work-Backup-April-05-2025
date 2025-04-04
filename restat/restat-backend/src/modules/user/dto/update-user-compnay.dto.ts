import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class UpdateUserCompanyDto {
  @ApiProperty({
    type: String,
    description: 'The user id.',
  })
  @IsString()
  id: string;

  @ApiProperty({
    type: String,
    description: 'This is a optional property to update the user.'
  })
  @IsString()
  @IsNotEmpty()
  companyId: string;
}
