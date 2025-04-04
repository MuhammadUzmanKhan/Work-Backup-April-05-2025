import { STRING, INTEGER, BOOLEAN, TIME, TEXT } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
  HasMany,
} from 'sequelize-typescript';
import { Event, Message } from '.';

@Table({
  tableName: 'incident_message_centers',
  underscored: true,
  timestamps: true,
})
export class IncidentMessageCenter extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  name: string;

  @Column({ type: STRING })
  phone_number: string;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @Column({ type: STRING })
  country_code: string;

  @Column({ type: STRING })
  country_iso_code: string;

  @Column({ type: BOOLEAN })
  snooze: boolean;

  @Column({ type: TIME })
  start_time: string;

  @Column({ type: TIME })
  end_time: string;

  @Column({ type: TEXT })
  snooze_message: string;

  @BelongsTo(() => Event)
  events: Event;

  @HasMany(() => Message, {
    foreignKey: 'messageable_id',
    constraints: false,
    scope: { messageable_type: 'IncidentMessageCenter' },
    as: 'incident_message_center_messages',
  })
  incident_message_center_messages: Message[];
}
