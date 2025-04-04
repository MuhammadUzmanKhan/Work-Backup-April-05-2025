import { STRING, INTEGER, TEXT } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { Event } from '.';

@Table({
  tableName: 'message_settings',
  underscored: true,
  timestamps: true,
})
export class MessageSetting extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  message_type: string;

  @Column({ type: TEXT })
  message_text: string;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @BelongsTo(() => Event)
  events: Event;
}
