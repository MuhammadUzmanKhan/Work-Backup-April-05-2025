import { STRING, INTEGER, BOOLEAN } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { NotificationSetting } from '.';

@Table({
  schema: 'notification',
  tableName: 'notification_setting_types',
  underscored: true,
  timestamps: true,
})
export class NotificationSettingType extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  notification_type: string;

  @Column({ type: BOOLEAN, defaultValue: true })
  is_enabled: boolean;

  @Column({ type: BOOLEAN, defaultValue: false })
  mobile: boolean;

  @Column({ type: BOOLEAN, defaultValue: false })
  email: boolean;

  @Column({ type: BOOLEAN, defaultValue: true })
  sms: boolean;

  @ForeignKey(() => NotificationSetting)
  @Column({ type: INTEGER })
  notification_setting_id: number;

  @BelongsTo(() => NotificationSetting)
  notification_setting: NotificationSetting;
}
