import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsOptional } from "class-validator";
import { ROLES } from "src/common/constants/roles";

export class UpdateInvitationDto {
  @ApiProperty({
    type: String,
    description: 'This is an optional property to send invite.'
  })
  @IsOptional()
  @IsEmail()
  email: string;

  @ApiProperty({
    type: String,
    description: 'This is an optional property to send invite.'
  })
  @IsOptional()
  @IsEnum(ROLES)
  role:ROLES;
}
