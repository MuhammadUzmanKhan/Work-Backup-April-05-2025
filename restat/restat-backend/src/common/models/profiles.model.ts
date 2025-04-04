import { STRING, UUID, UUIDV4 } from "sequelize";
import {
  AllowNull,
  Column,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { Workspaces } from "./workspaces.model";
import { LinkedinAccountsData } from "./linkedin-account-data.model";
import { SOURCE } from "../constants/source";
import { Bids } from "./bids.model";

@Table({ tableName: "profiles", paranoid: true, timestamps: true })
export class Profiles extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @AllowNull(false)
  @Column({ type: STRING })
  name: string;

  @AllowNull(false)
  @Column({ type: STRING })
  url: string;

  @Column({ type: STRING, defaultValue: SOURCE.UPWORK })
  source: SOURCE;

  @ForeignKey(() => Workspaces)
  @Column({ type: UUID })
  companyId: string;

  @Column({ type: STRING })
  clickupId: string;

  @Column({ type: STRING })
  clickupUsername: string;

  @Column({ type: STRING })
  clickupEmail: string;

  @Column({ type: STRING })
  clickupProfilePicture: string;

  @HasMany(() => LinkedinAccountsData)
  linkedinAccountsData: LinkedinAccountsData[];

  @HasMany(() => Bids)
  bids: Bids[];
}
