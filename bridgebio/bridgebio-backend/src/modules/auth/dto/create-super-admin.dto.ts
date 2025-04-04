import { IsNotEmpty } from "class-validator";
import { RegisterUserDto } from "./create-user.dto";
import { ApiProperty, OmitType } from "@nestjs/swagger";

export class CreateSuperAdminDto extends OmitType(RegisterUserDto, ['permissions']) {
    @IsNotEmpty()
    @ApiProperty({
        type: String,
        description: "Secret Key",
        required: true
    })
    secretKey: string;
}