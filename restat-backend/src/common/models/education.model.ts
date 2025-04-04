// It is a junction model of linkedin account and institution
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
import { LinkedinAccountsData } from "./linkedin-account-data.model";
import { STRING } from "sequelize";
import { TEXT } from "sequelize";

@Table({ tableName: "education", timestamps: true })
export class Education extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @AllowNull(true)
  @Column({ type: STRING })
  duration: string;

  @AllowNull(true)
  @Column({ type: TEXT })
  degree: string;

  @ForeignKey(() => LinkedinAccountsData)
  linkedinAccountId: string;

  @ForeignKey(() => Institutions)
  institutionId: string;

  @BelongsTo(() => LinkedinAccountsData)
  linkedinAccountsData: LinkedinAccountsData;

  @BelongsTo(() => Institutions)
  institutions: Institutions;

}
