import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import { AuthenticateUserDto } from "src/modules/auth/dto/authenticate.dto";

export class VerifyOtpDto extends AuthenticateUserDto {
    @ApiProperty({
        type: String,
        description: 'This is a required property received on email on login.'
    })
    @IsString()
    @IsNotEmpty()
    otp: string;
}