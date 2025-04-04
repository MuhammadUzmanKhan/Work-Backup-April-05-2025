import { STRING, INTEGER, TEXT, NUMBER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AutoIncrement,
  HasMany,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { UserNotification, Company } from '..';

@Table({
  schema: 'notification',
  tableName: 'notifications',
  underscored: true,
  timestamps: true,
})
export class Notification extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: TEXT })
  message: string;

  @Column({ type: TEXT })
  message_html: string;

  @Column({ type: STRING })
  module: string;

  @Column({ type: STRING })
  type: string;

  @Column({ type: NUMBER })
  module_id: number;

  @Column({ type: NUMBER })
  comment_id: number;

  @ForeignKey(() => Company)
  @Column({ type: INTEGER })
  company_id: number;

  @BelongsTo(() => Company)
  company: Company;

  @HasMany(() => UserNotification, { onDelete: 'CASCADE' })
  user_notifications: UserNotification[];
}
