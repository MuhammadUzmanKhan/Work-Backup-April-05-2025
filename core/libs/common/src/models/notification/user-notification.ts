import { INTEGER, TEXT } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User, Notification } from '..';

@Table({
  schema: 'notification',
  tableName: 'user_notifications',
  underscored: true,
  timestamps: true,
})
export class UserNotification extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: TEXT, defaultValue: true })
  unread: string;

  @ForeignKey(() => Notification)
  @Column({ type: INTEGER })
  notification_id: number;

  @BelongsTo(() => Notification)
  notification: Notification;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  user_id: number;

  @BelongsTo(() => User)
  user: User;
}
