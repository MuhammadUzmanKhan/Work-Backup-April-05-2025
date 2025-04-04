import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsString } from "class-validator";

export class ClickUpIntegrationDTO {
    @ApiProperty({
        description: 'Workspace Id of the selected workspace.',
    })
    @IsString()
    workspaceId: string;

    @ApiProperty({
        description: 'Name of the selected workspace.',
    })
    @IsString()
    workspaceName: string;

    @ApiProperty({
        description: 'Id of the selected space within the workspace.',
    })
    @IsString()
    spaceId: string;

    @ApiProperty({
        description: 'Name of the selected space within the workspace.',
    })
    @IsString()
    spaceName: string;

    @ApiProperty({
        description: 'Id of the selected folder within the space.',
    })
    @IsString()
    folderId: string;

    @ApiProperty({
        description: 'Name of the selected folder within the space.',
    })
    @IsString()
    folderName: string;

    @ApiProperty({
        description: 'Id of the selected list within the folder.',
    })
    @IsString()
    listId: string;

    @ApiProperty({
        description: 'Name of the selected list within the folder.',
    })
    @IsString()
    listName: string;

    @ApiProperty({
        description: 'The status name under the task should be created.',
    })
    @IsString()
    status: string;

    @ApiProperty({
        description: 'Checkbox to identify if the list is folderless.',
    })
    @IsBoolean()
    isFolderlessList: boolean;

    @ApiProperty({
        description: 'Checkbox to identify if the list is from shared hierarchy.',
    })
    @IsBoolean()
    isSharedHierarchy: boolean;

    @ApiProperty({
        description: 'Type of Clickup integration, i.e. Contacts, Deals',
    })
    @IsString()
    subType: string;

}
