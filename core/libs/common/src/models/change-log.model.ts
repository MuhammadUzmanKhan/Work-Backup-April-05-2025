import { STRING, INTEGER, NUMBER, DATE, JSONB } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { Event, EventCad, EventUser, LegalGroup, User } from '.';

@Table({
  tableName: 'change_logs',
  underscored: true,
  timestamps: true,
})
export class ChangeLog extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: NUMBER })
  change_logable_id: number;

  @Column({ type: STRING })
  change_logable_type: string;

  @Column({ type: STRING })
  column: string;

  @Column({ type: STRING })
  old_value: string;

  @Column({ type: STRING })
  new_value: string;

  @Column({ type: STRING })
  formatted_log_text: string;

  @Column({ type: DATE })
  parent_changed_at: Date;

  /*
   we can store any extra information other than newVal and
   oldVal so do not have to extract it in translations we can store multiple values
   **/
  @Column({ type: JSONB })
  additional_values: object;

  @ForeignKey(() => User)
  @Column({ type: NUMBER })
  editor_id: number;

  @Column({ type: STRING })
  editor_type: string;

  @BelongsTo(() => Event, {
    foreignKey: 'change_logable_id',
    constraints: false,
  })
  events: Event;

  @BelongsTo(() => EventCad, {
    foreignKey: 'change_logable_id',
    constraints: false,
  })
  event_cad: EventCad;

  @BelongsTo(() => EventUser, {
    foreignKey: 'change_logable_id',
    constraints: false,
  })
  event_user: EventUser;

  @BelongsTo(() => LegalGroup, {
    foreignKey: 'change_logable_id',
    constraints: false,
  })
  legal_group: LegalGroup;

  @BelongsTo(() => User)
  users: User;
}
