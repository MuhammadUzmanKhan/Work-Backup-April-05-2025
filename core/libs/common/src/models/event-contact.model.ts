import { STRING, INTEGER, Sequelize, TEXT } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
  BelongsToMany,
  HasMany,
} from 'sequelize-typescript';
import { Literal } from 'sequelize/types/utils';
import { Event, Company, ContactDirectory, Alert } from '.';

@Table({
  tableName: 'event_contacts',
  underscored: true,
  timestamps: true,
})
export class EventContact extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @Column({ type: INTEGER })
  info_type: number;

  @Column({ type: STRING })
  title: string;

  @Column({ type: STRING })
  contact_name: string;

  @Column({ type: INTEGER })
  creator_id: number;

  @Column({ type: STRING })
  city: string;

  @Column({ type: STRING })
  contact_phone: string;

  @Column({ type: STRING })
  contact_email: string;

  @Column({ type: INTEGER })
  expected_presence: number;

  @Column({ type: STRING })
  first_name: string;

  @Column({ type: STRING })
  last_name: string;

  @ForeignKey(() => Company)
  @Column({ type: INTEGER })
  company_id: number;

  @Column({ type: STRING })
  name: string;

  @Column({ type: STRING })
  country_code: string;

  @Column({ type: STRING })
  country_iso_code: string;

  @Column({ type: TEXT })
  description: string;

  @HasMany(() => ContactDirectory)
  contact_directories: ContactDirectory[];

  @BelongsToMany(() => Event, () => ContactDirectory)
  events: Event[];

  @BelongsTo(() => Company)
  company: Company;

  @HasMany(() => Alert)
  event_contact_alerts: Alert[];

  // Computed property
  public static getInfoTypeByKey: Literal = Sequelize.literal(`(
    CASE 
        WHEN "EventContact"."info_type" IS NOT NULL THEN 
        CASE 
            WHEN "EventContact"."info_type" = 0 THEN 'agency_information'
            WHEN "EventContact"."info_type" = 1 THEN 'key_contact'
            ELSE NULL
          END
        ELSE NULL
      END
    )
    `);
}
