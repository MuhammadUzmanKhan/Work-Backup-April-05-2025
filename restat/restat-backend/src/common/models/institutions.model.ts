import { STRING, UUID, UUIDV4 } from "sequelize";
import {
  AllowNull,
  BelongsToMany,
  Column,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { Contacts } from "./contacts.model";
import { ContactEducation } from "./contact-education.model";

@Table({ tableName: "institutions", paranoid: true, timestamps: true})
export class Institutions extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @AllowNull(false)
  @Column({ type: STRING })
  name: string;

  @BelongsToMany(() => Contacts, () => ContactEducation)
  contact: Contacts[];

  @HasMany(() => ContactEducation)
  education: ContactEducation[];
}
