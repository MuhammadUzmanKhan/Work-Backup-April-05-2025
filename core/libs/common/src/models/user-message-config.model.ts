import { BOOLEAN, INTEGER, STRING } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AutoIncrement,
  BelongsTo,
} from 'sequelize-typescript';
import { User, Message, Event } from '.';

@Table({
  tableName: 'user_message_configs',
  underscored: true,
  timestamps: true,
})
export class UserMessageConfig extends Model {
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

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  config_id: number;

  @Column({ type: STRING })
  config_type: string;

  @Column({ type: BOOLEAN, defaultValue: false })
  pinned: boolean;

  @Column({ type: BOOLEAN, defaultValue: false })
  archived: boolean;

  @Column({ type: INTEGER })
  message_type: number;

  @Column({ type: STRING })
  color: string;

  @ForeignKey(() => Message)
  @Column({ allowNull: false, type: INTEGER })
  message_id: number;

  @BelongsTo(() => Event)
  event: Event;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Message)
  message: Message;
}
