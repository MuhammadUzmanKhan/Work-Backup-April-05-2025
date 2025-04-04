import { STRING, UUID, UUIDV4 } from "sequelize";
import {
  AllowNull,
  Column,
  Model,
  PrimaryKey,
  Table,
  BelongsToMany,
  HasMany,
  DataType,
} from "sequelize-typescript";
import {LinkedinAccountsData } from "./linkedin-account-data.model";
import { Experience } from "./experience.model";

@Table({ tableName: "linkedin-account-companies", paranoid: true, timestamps: true })
export class LinkedinAccountCompanies extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @AllowNull(false)
  @Column({ type: STRING })
  name: string;

  @AllowNull(true)
  @Column({ type: STRING })
  location: string;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  deletedAt: Date;

  @BelongsToMany(() => LinkedinAccountsData, () => Experience)
  linkedinAccountsData: LinkedinAccountsData[];

  @HasMany(() => Experience)
  experience: Experience[];
}
