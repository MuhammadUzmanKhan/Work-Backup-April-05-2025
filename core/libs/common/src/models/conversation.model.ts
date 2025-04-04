import { STRING, INTEGER, NUMBER, TEXT } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
  HasOne,
} from 'sequelize-typescript';
import { Event, Message, UserConversationConfig } from '.';

@Table({
  tableName: 'conversations',
  underscored: true,
  timestamps: true,
})
export class Conversation extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: TEXT })
  color: string;

  @ForeignKey(() => Event)
  @Column({ type: NUMBER })
  event_id: number;

  @ForeignKey(() => Message)
  @Column({ type: NUMBER })
  message_id: number;

  @Column({ type: STRING })
  to_number: string;

  @Column({ type: STRING })
  from_number: string;

  @BelongsTo(() => Event)
  event: Event;

  @BelongsTo(() => Message)
  message: Message;

  @HasOne(() => UserConversationConfig)
  userConversationConfig: UserConversationConfig;
}
