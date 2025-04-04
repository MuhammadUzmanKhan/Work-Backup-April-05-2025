// It is a junction model of linkedin account and skills
import { UUID, UUIDV4 } from "sequelize";
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  BelongsTo,
  AllowNull,
  DataType,
} from "sequelize-typescript";
import { LinkedinAccountsData } from "./linkedin-account-data.model";
import { Skills } from "./skills.model";

@Table({ tableName: "linkedin-account-skills", timestamps: true })
export class LinkedinAccountSkills extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @ForeignKey(() => LinkedinAccountsData)
  linkedinAccountId: string;

  @ForeignKey(() => Skills)
  skillId: string;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  deletedAt: Date;

  @BelongsTo(() => LinkedinAccountsData)
  linkedinAccountsData: LinkedinAccountsData;

  @BelongsTo(() => Skills)
  skills: Skills;

}


