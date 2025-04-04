import { Permissions} from "@common/types";
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class PermissionsDto {
    @IsNotEmpty()
    @ApiProperty({ type: Boolean })
    [Permissions.MEDS]: boolean;

    @IsNotEmpty()
    @ApiProperty({ type: Boolean })
    [Permissions.EVIDENCE_GENERATION_FRAMEWORK]: boolean;

    @IsNotEmpty()
    @ApiProperty({ type: Boolean })
    [Permissions.EVIDENCE_GENERATION_PRIORITIES]: boolean;

    @IsNotEmpty()
    @ApiProperty({ type: Boolean })
    [Permissions.RESEARCH_INITIATIVES]: boolean;

    @IsNotEmpty()
    @ApiProperty({ type: Boolean })
    [Permissions.RESEARCH_TEAMS]: boolean;

    @IsNotEmpty()
    @ApiProperty({ type: Boolean })
    [Permissions.EVIDENCE_LITERATURE_LIBRARY]: boolean;
}