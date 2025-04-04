import { INTEGER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AutoIncrement,
  BelongsTo,
} from 'sequelize-typescript';
import { User, MessageGroup } from '.';
import { Vendor } from './vendor.model';

@Table({
  tableName: 'message_group_users',
  underscored: true,
  timestamps: true,
})
export class MessageGroupUsers extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  user_id: number;

  @ForeignKey(() => MessageGroup)
  @Column({ type: INTEGER })
  message_group_id: number;

  @ForeignKey(() => Vendor)
  @Column({ type: INTEGER })
  associated_group_id: number;

  @BelongsTo(() => MessageGroup)
  message_group: MessageGroup;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => MessageGroup, { as: 'associated_group' })
  associated_group: MessageGroup;
}
