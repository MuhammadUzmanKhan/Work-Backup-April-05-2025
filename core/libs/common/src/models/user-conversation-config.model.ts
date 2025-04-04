import { BOOLEAN, DATE, INTEGER, NUMBER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { Conversation } from '.';

@Table({
  tableName: 'user_conversation_configs',
  underscored: true,
  timestamps: true,
})
export class UserConversationConfig extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Conversation)
  @Column({ type: NUMBER })
  conversation_id: number;

  @Column({ type: BOOLEAN })
  pinned: boolean;

  @Column({ type: BOOLEAN })
  archived: boolean;

  @Column({ type: BOOLEAN })
  concluded: boolean;

  @Column({ type: DATE })
  concluded_time: Date;

  @Column({ type: NUMBER })
  concluded_message_id: number;

  @BelongsTo(() => Conversation)
  conversations: Conversation;
}
