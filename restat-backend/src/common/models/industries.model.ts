import { STRING, UUID, UUIDV4 } from "sequelize";
import { AllowNull, BelongsTo, Column, ForeignKey, HasMany, Model, PrimaryKey, Table } from "sequelize-typescript";
import { LinkedinAccountsData } from "./linkedin-account-data.model";
import { IsOptional } from "class-validator";
import { Workspaces } from "./workspaces.model";

@Table({ tableName: "industries", paranoid: true, timestamps: true })
export class Industries extends Model {
    @PrimaryKey
    @Column({ type: UUID, defaultValue: UUIDV4 })
    id: string;

    @AllowNull(false)
    @Column({ type: STRING })
    name: string;

    @AllowNull(true)
    @Column({ type: STRING })
    @IsOptional()
    description: string;

    @ForeignKey(() => Workspaces)
    @Column({ type: UUID })
    workspaceId: string;

    @BelongsTo(() => Workspaces, {
        onDelete: 'CASCADE'
    })
    workspace: Workspaces;

    @HasMany(() => LinkedinAccountsData)
    linkedinAccountsData: LinkedinAccountsData[];
}
