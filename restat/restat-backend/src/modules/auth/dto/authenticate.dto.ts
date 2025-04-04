import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class AuthenticateUserDto {
    @ApiProperty({
        type: String,
        description: 'This is a required property return by firebase on login/signup'
    })
    @IsString()
    @IsNotEmpty()
    idToken: string;
}