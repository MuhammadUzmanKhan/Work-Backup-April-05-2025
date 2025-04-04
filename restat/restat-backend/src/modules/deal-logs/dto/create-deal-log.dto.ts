import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsString } from "class-validator";
import { DEAL_LOG_TYPE } from "src/common/constants/bids";

export class CreateDealLogDto {
    @ApiProperty({
        type: String,
        description: 'This is a required property to create deal log.'
    })
    @IsEnum(DEAL_LOG_TYPE)
    dealLogType: string;

    @ApiProperty({
        type: String,
        description: 'This is a required property to create deal log.'
    })
    @IsString()
    bidId: string;

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
