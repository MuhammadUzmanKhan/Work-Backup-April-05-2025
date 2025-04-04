import { DATE, INTEGER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AutoIncrement,
  BelongsTo,
} from 'sequelize-typescript';
import { User, Event } from '.';

@Table({
  tableName: 'staff_event_schedules',
  underscored: true,
  timestamps: true,
})
export class StaffEventSchedule extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  user_id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @Column({ type: DATE })
  shift_start_time: string;

  @Column({ type: DATE })
  shift_end_time: string;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Event)
  event: Event;
}
