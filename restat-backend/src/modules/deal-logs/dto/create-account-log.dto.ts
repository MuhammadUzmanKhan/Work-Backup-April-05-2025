import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsString } from "class-validator";
import { ACCOUNT_LOG_TYPE } from "src/common/constants/bids";

export class CreateAccountLogDto {
    @ApiProperty({
        type: String,
        description: 'This is a required property to create deal log.'
    })
    @IsEnum(ACCOUNT_LOG_TYPE)
    contactLogType: string;

    @ApiProperty({
        type: String,
        description: 'This is a required property to create deal log.'
    })
    @IsString()
    contactId: string;

    @ApiProperty({
        type: String,
        description: 'This is a required property to create deal log.'
    })
    @IsString()
    userId: string;

    @ApiProperty({
        type: String,
        description: 'This is a required property to create deal log.'
    })
    @IsString()
    message: string;
}
