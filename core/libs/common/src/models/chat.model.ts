import {
  Table,
  Column,
  Model,
  ForeignKey,
  AutoIncrement,
  PrimaryKey,
  DataType,
  Default,
  BelongsTo,
} from 'sequelize-typescript';
import { LegalGroup, User } from '.';
import { ChatTypeEnum } from '../constants';

@Table({
  tableName: 'chats',
  underscored: true,
  timestamps: true,
})
export class Chat extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  id: number;

  @ForeignKey(() => LegalGroup)
  @Column({ type: DataType.INTEGER })
  legal_group_id: number;

  @Column({ type: DataType.TEXT })
  message: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER })
  sender_id: number;

  @Column({ type: DataType.STRING })
  sender_info: string;

  @Default(false)
  @Column({ type: DataType.BOOLEAN })
  is_attachment: boolean;

  @Column({
    type: DataType.ENUM(...Object.values(ChatTypeEnum)),
  })
  type: ChatTypeEnum;

  @Column({ type: DataType.STRING })
  attachment_name: string;

  @BelongsTo(() => LegalGroup, { onDelete: 'CASCADE' })
  legalGroup: LegalGroup;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  sender: User;
}
