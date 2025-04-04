import { UUID, UUIDV4, DATE } from "sequelize";
import { Model, AllowNull, BelongsTo, Column, ForeignKey, PrimaryKey, Table } from "sequelize-typescript";
import { Workspaces } from "./workspaces.model";

@Table({ tableName: "workspace-deletion", paranoid: true, timestamps: true })
export class WorkspaceDeletion extends Model {
    @PrimaryKey
    @Column({ type: UUID, defaultValue: UUIDV4 })
    id: string;

    @ForeignKey(() => Workspaces)
    @Column({ type: UUID })
    workspaceId: string;

    @AllowNull(false)
    @Column({ type: DATE })
    deletionDate: Date;

    @BelongsTo(() => Workspaces)
    workspace: Workspaces;
}
