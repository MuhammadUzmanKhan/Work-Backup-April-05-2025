import { STRING, UUID, UUIDV4 } from "sequelize";
import {
  AllowNull,
  Column,
  Model,
  PrimaryKey,
  Table,
  BelongsToMany,
  HasMany,
} from "sequelize-typescript";
import { ContactSkills } from "./contact-skills.model";
import { Contacts } from "./contacts.model";

@Table({ tableName: "skills", paranoid: true, timestamps: true })
export class Skills extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @AllowNull(false)
  @Column({ type: STRING })
  name: string;

  @BelongsToMany(() => Contacts, () => ContactSkills)
  contact: Contacts[];

  @HasMany(() => ContactSkills)
  contactSkills: ContactSkills[];
}
