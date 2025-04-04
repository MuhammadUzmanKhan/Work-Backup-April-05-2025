import { STRING, INTEGER } from 'sequelize';
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
import { NotificationSettingType, User } from '..';

@Table({
  schema: 'notification',
  tableName: 'notification_settings',
  underscored: true,
  timestamps: true,
})
export class NotificationSetting extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  module: string;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  user_id: number;

  @BelongsTo(() => User)
  users: User;

  @HasMany(() => NotificationSettingType, { onDelete: 'CASCADE' })
  notification_setting_types: NotificationSettingType[];
}
