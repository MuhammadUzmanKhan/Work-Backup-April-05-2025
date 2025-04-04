import { IsNotEmpty, IsUUID, ValidateNested } from "class-validator";
import { PermissionsDto } from "./permissions.dto";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateUserPermissionsDto {
    @IsNotEmpty()
    @IsUUID()
    @ApiProperty({
        type: String,
        description: "User ID",
        required: true,
        format: 'uuid'
    })
    userId: string;

    @IsNotEmpty({ message: 'User Permissions are required!' })
    @ValidateNested()
    @Type(() => PermissionsDto)
    @ApiProperty({
        type: PermissionsDto,
        description: "Allowed Permissions",
        required: true
    })
    permissions: PermissionsDto;
}