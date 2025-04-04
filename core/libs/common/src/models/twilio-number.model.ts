import { STRING, INTEGER, BOOLEAN } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  HasMany,
  BelongsToMany,
} from 'sequelize-typescript';
import { Company, EventTwilioNumbers, Event } from '.';

@Table({
  tableName: 'twilio_numbers',
  underscored: true,
  timestamps: true,
})
export class TwilioNumber extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Company)
  @Column({ type: INTEGER })
  company_id: number;

  @Column({ type: STRING })
  phone_number: string;

  @Column({ type: BOOLEAN })
  is_enabled: boolean;

  @BelongsTo(() => Company)
  company: Company;

  @HasMany(() => EventTwilioNumbers)
  event_twilio_numbers: EventTwilioNumbers[];

  @BelongsToMany(() => Event, () => EventTwilioNumbers)
  events: Event[];
}
