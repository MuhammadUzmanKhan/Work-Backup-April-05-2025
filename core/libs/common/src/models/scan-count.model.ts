import { STRING, INTEGER, DATE } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Event, User } from '.';

@Table({
  tableName: 'scan_counts',
  underscored: true,
  timestamps: true,
})
export class ScanCount extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: DATE })
  logged_time: Date;

  @Column({ type: INTEGER })
  logged_count: number;

  @Column({ type: STRING })
  note: string;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  user_id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @BelongsTo(() => Event)
  events: Event;

  @BelongsTo(() => User)
  users: User;
}
