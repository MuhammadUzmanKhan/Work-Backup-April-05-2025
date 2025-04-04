import { STRING } from "sequelize";
import { UUID, UUIDV4 } from "sequelize";
import { Model, AllowNull, BelongsTo, Column, ForeignKey, PrimaryKey, Table } from "sequelize-typescript";
import { DEAL_LOG_TYPE } from "../constants/bids";
import { Users } from "./users.model";
import { Bids } from "./bids.model";
import { TEXT } from "sequelize";
import { Contacts } from "./contacts.model";

@Table({ tableName: "deal_logs", paranoid: true, timestamps: true })
export class DealLogs extends Model {
    @PrimaryKey
    @Column({ type: UUID, defaultValue: UUIDV4 })
    id: string;

    @AllowNull(false)
    @Column({ type: STRING })
    dealLogType: DEAL_LOG_TYPE;

    @ForeignKey(() => Bids)
    @Column({ type: UUID })
    bidId?: string;

    @ForeignKey(() => Contacts)
    @Column({ type: UUID })
    contactId?: string;

    @ForeignKey(() => Users)
    @Column({ type: UUID })
    userId: string;

    @AllowNull(false)
    @Column({ type: TEXT })
    message: string;

    @BelongsTo(() => Bids)
    bid: Bids;

    @BelongsTo(() => Users)
    user: Users;

    @BelongsTo(() => Contacts)
    contact: Contacts;
}
