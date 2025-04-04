import { STRING, INTEGER, TEXT, BOOLEAN, DATE } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { Event, User } from '.';

@Table({
  tableName: 'notes',
  underscored: true,
  timestamps: true,
})
export class Note extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: TEXT })
  body: string;

  @Column({ type: BOOLEAN })
  unread: boolean;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  user_id: number;

  @Column({ type: INTEGER })
  noteable_id: number;

  @Column({ type: STRING })
  noteable_type: string;

  @Column({ type: BOOLEAN })
  is_updated: boolean;

  @Column({ type: BOOLEAN })
  is_weather_log: boolean;

  @Column({ type: BOOLEAN })
  is_broadcasted: boolean;

  @Column({ type: DATE })
  last_broadcast_time: Date;

  @Column({ type: BOOLEAN, defaultValue: false })
  is_private: boolean;

  @BelongsTo(() => Event, {
    foreignKey: 'noteable_id',
    constraints: false,
  })
  event: Event;

  @BelongsTo(() => User)
  user: User;
}
