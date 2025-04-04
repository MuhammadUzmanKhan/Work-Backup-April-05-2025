import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString } from "class-validator";

export class HubspotIntegrationDTO {
    @ApiProperty({
        description: 'Pipeline Id of the selected pipeline.',
    })
    @IsString()
    pipelineId: string;

    @ApiProperty({
        description: 'Name of the selected pipeline.',
    })
    @IsString()
    pipelineName: string;

    @ApiProperty({
        description: 'Id of the selected stage within the pipeline.',
    })
    @IsString()
    stageId: string;

    @ApiProperty({
        description: 'Name of the selected stage within the pipeline.',
    })
    @IsString()
    stageName: string;

    @ApiProperty({
        description: 'Array of custom fields.',
    })
    @IsArray()
    @IsOptional()
    customFields: object[];

}
