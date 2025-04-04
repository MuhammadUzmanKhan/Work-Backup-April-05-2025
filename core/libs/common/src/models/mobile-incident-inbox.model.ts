import { STRING, INTEGER, Sequelize } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { Literal } from 'sequelize/types/utils';
import { Event } from '.';

@Table({
  tableName: 'mobile_incident_inboxes',
  underscored: true,
  timestamps: true,
})
export class MobileIncidentInbox extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @Column({ type: STRING })
  name: string;

  @Column({ type: INTEGER })
  visible_status: number;

  @Column({ type: STRING })
  phone_number: string;

  @Column({ type: STRING })
  country_code: string;

  @Column({ type: STRING })
  country_iso_code: string;

  @BelongsTo(() => Event)
  events: Event;

  // Computed property
  public static getStatusNameByKey: Literal = Sequelize.literal(`(
    CASE 
        WHEN "MobileIncidentInbox"."visible_status" IS NOT NULL THEN 
        CASE 
            WHEN "MobileIncidentInbox"."visible_status" = 0 THEN 'hide'
            WHEN "MobileIncidentInbox"."visible_status" = 1 THEN 'show'
            ELSE NULL
          END
        ELSE NULL
      END
    )
    `);
}
