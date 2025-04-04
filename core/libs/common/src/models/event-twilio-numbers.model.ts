import { STRING, INTEGER, BOOLEAN } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Event, TwilioNumber } from '.';

@Table({
  tableName: 'event_twilio_numbers',
  underscored: true,
  timestamps: true,
})
export class EventTwilioNumbers extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @ForeignKey(() => TwilioNumber)
  @Column({ type: INTEGER })
  twilio_number_id: number;

  @Column({ type: STRING })
  inbox_name: string;

  @BelongsTo(() => Event)
  Event: Event;

  @BelongsTo(() => TwilioNumber)
  twilio_number: TwilioNumber;
}
