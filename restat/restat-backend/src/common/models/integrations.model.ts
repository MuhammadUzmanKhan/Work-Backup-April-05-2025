// It is a junction table of linkedin-accounts-data and linkedin-account-companies
// It is a junction model of linkedin account, institution and degree
import { UUID, UUIDV4 } from "sequelize";
import {
    Column,
    PrimaryKey,
    Table,
    Model,
    AllowNull,
    ForeignKey,
    BelongsTo,

} from "sequelize-typescript";
import { TEXT, DATE, STRING, BOOLEAN } from "sequelize";
import { CustomFieldDTO } from "src/modules/integrations/dto/clickup-fields-mapping-dto";
import { JSON } from "sequelize";
import { CLICKUP_SUB_TYPES, INTEGRATION_TYPES } from "../constants/integrations";
import { Users } from "./users.model";

@Table({ tableName: "integrations", timestamps: true })
export class Integrations extends Model {
    @PrimaryKey
    @Column({ type: UUID, defaultValue: UUIDV4 })
    id: string;

    @Column({ type: STRING })
    type: INTEGRATION_TYPES;

    @Column({ type: STRING })
    subType: CLICKUP_SUB_TYPES;

    @Column({ type: STRING })
    companyId: string;

    @ForeignKey(() => Users)
    @Column({ type: UUID })
    userId: string;

    @AllowNull(true)
    @Column({ type: STRING })
    access_token: string;

    @AllowNull(true)
    @Column({ type: STRING })
    refresh_token: string;

    @AllowNull(true)
    @Column({ type: DATE })
    token_expires_at: Date;

    @AllowNull(true)
    @Column({ type: TEXT })
    pipelineId: string;

    @AllowNull(true)
    @Column({ type: TEXT })
    pipelineName: string;

    @AllowNull(true)
    @Column({ type: TEXT })
    stageId: string;

    @AllowNull(true)
    @Column({ type: TEXT })
    stageName: string;

    @AllowNull(true)
    @Column({ type: TEXT })
    hubspot_owner_id: string;

    @AllowNull(true)
    @Column({ type: TEXT })
    hub_id: string;

    @AllowNull(true)
    @Column({ type: TEXT })
    workspaceId: string;

    @AllowNull(true)
    @Column({ type: TEXT })
    workspaceName: string;

    @AllowNull(true)
    @Column({ type: TEXT })
    spaceId: string;

    @AllowNull(true)
    @Column({ type: TEXT })
    spaceName: string;

    @AllowNull(true)
    @Column({ type: TEXT })
    folderId: string;

    @AllowNull(true)
    @Column({ type: TEXT })
    folderName: string;

    @AllowNull(true)
    @Column({ type: TEXT })
    listId: string;

    @AllowNull(true)
    @Column({ type: TEXT })
    listName: string;

    @AllowNull(true)
    @Column({ type: TEXT })
    status: string;

    @AllowNull(true)
    @Column({ type: BOOLEAN })
    isFolderlessList: boolean;

    @AllowNull(true)
    @Column({ type: BOOLEAN })
    isSharedHierarchy: boolean;

    @AllowNull(true)
    @Column({ type: JSON })
    customFields: CustomFieldDTO[];

    @BelongsTo(() => Users)
    user: Users;
}


