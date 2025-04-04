// Junction table of Contact and companies
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
import { STRING} from "sequelize";
import { TEXT } from "sequelize";
import { Contacts } from "./contacts.model";
import { Companies } from "./companies.model";

@Table({ tableName: "contact-experience", timestamps: true, paranoid: true })
export class ContactExperience extends Model {
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

  @ForeignKey(() => Contacts)
  contactId: string;

  @ForeignKey(() => Companies)
  companyId: string;

  @BelongsTo(() => Contacts)
  contact: Contacts;

  @BelongsTo(() => Companies)
  company: Companies;
}


