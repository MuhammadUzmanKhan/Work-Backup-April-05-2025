import { STRING } from "sequelize";
import { UUID, UUIDV4 } from "sequelize";
import { Model, AllowNull, Column, PrimaryKey, Table } from "sequelize-typescript";
import { DEAL_LOG_TYPE } from "../constants/bids";
import { BOOLEAN } from "sequelize";

@Table({ tableName: 'extension-releases', paranoid: true, timestamps: true })
export class ExtensionReleasesModal extends Model {
    @PrimaryKey
    @Column({ type: UUID, defaultValue: UUIDV4 })
    id: string;

    @AllowNull(false)
    @Column({ type: STRING })
    version: DEAL_LOG_TYPE;

    @AllowNull(true)
    @Column({ type: STRING })
    message: string;

    @AllowNull(false)
    @Column({
        type: BOOLEAN,
        defaultValue: false
    })
    forced: boolean;

    @AllowNull(false)
    @Column({
        type: BOOLEAN,
        defaultValue: false
    })
    isActive: boolean;
}

