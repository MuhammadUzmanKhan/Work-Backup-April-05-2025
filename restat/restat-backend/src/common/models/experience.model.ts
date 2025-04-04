// It is a junction table of linkedin-accounts-data and linkedin-account-companies
// It is a junction model of linkedin account, institution and degree
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
import { STRING} from "sequelize";
import { LinkedinAccountCompanies } from "./linkedin-account-companies.model";
import { TEXT } from "sequelize";

@Table({ tableName: "experience", timestamps: true })
export class Experience extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @AllowNull(true)
  @Column({ type: STRING })
  duration: string;

  @AllowNull(true)
  @Column({ type: STRING })
  totalDuration: string;
 
  @AllowNull(true)
  @Column({ type: TEXT })
  title: string;

  @ForeignKey(() => LinkedinAccountsData)
  linkedinAccountId: string;

  @ForeignKey(() => LinkedinAccountCompanies)
  linkedinAccountCompanyId: string;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  deletedAt: Date;

  @BelongsTo(() => LinkedinAccountsData)
  linkedinAccountsData: LinkedinAccountsData;

  @BelongsTo(() => LinkedinAccountCompanies)
  linkedinAccountCompanies: LinkedinAccountCompanies;
}


