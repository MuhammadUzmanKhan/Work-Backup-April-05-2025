// Junction Model of Contacts and Skills
import { UUID, UUIDV4 } from "sequelize";
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { Skills } from "./skills.model";
import { Contacts } from "./contacts.model";

@Table({ tableName: "contact-skills", timestamps: true })
export class ContactSkills extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @ForeignKey(() => Contacts)
  contactId: string;

  @ForeignKey(() => Skills)
  skillId: string;

  @BelongsTo(() => Contacts)
  contact: Contacts;

  @BelongsTo(() => Skills)
  skills: Skills;

}


