// Junction model of Contacts and Institution
import { UUID, UUIDV4 } from "sequelize";
import {
    Column,
    PrimaryKey,
    Table,
    Model,
    ForeignKey,
    BelongsTo,
    AllowNull,
} from "sequelize-typescript";
import { Institutions } from "./institutions.model";
import { STRING } from "sequelize";
import { TEXT } from "sequelize";
import { Contacts } from "./contacts.model";

@Table({
    tableName: "contact-education",
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ["degree", "contactId", "institutionId"],
        },
    ],
})
export class ContactEducation extends Model {
    @PrimaryKey
    @Column({ type: UUID, defaultValue: UUIDV4 })
    id: string;

    @AllowNull(true)
    @Column({ type: STRING })
    duration: string;

    @AllowNull(true)
    @Column({ type: TEXT })
    degree: string;

    @ForeignKey(() => Contacts)
    contactId: string;

    @ForeignKey(() => Institutions)
    institutionId: string;

    @BelongsTo(() => Contacts)
    contact: Contacts;

    @BelongsTo(() => Institutions)
    institutions: Institutions;

}
