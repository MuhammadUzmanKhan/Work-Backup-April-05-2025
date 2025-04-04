import { UUID, UUIDV4, STRING, BOOLEAN } from "sequelize";
import {
  AllowNull,
  BelongsTo,
  Column,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { Users } from "./users.model";
import { Profiles } from "./profiles.model";
import { Contacts } from "./contacts.model";
import { Industries } from "./industries.model";


@Table({
  tableName: "linkedin-references",
  paranoid: true,
  timestamps: true,
})
export class LinkedinReferences extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4, primaryKey: true })
  id: string;

  @ForeignKey(() => Users)
  @Column({ type: UUID })
  userId: string;

  @ForeignKey(() => Profiles)
  @Column({ type: UUID })
  linkedinProfileId: string;

  @ForeignKey(() => Contacts)
  @Column({ type: UUID })
  contactId: string;

  @ForeignKey(() => Industries)
  @Column({ type: UUID })
  industryId: string;

  @AllowNull(true)
  @Column({ type: BOOLEAN })
  linkedinConnected: boolean;

  @AllowNull(true)
  @Column({ type: STRING })
  linkedinConnectedDate: string; 

  @BelongsTo(() => Users)
  user: Users

  @BelongsTo(() => Profiles)
  profile: Profiles

  @BelongsTo(() => Contacts)
  contact: Contacts

  @BelongsTo(() => Industries)
  industry: Industries

}
