import { STRING, INTEGER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  Unique,
  AllowNull,
  ForeignKey,
  BelongsTo,
  AutoIncrement,
} from 'sequelize-typescript';
import { User } from '.';

@Table({
  tableName: 'user_tokens',
  underscored: true,
  timestamps: true,
})
export class UserToken extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Unique
  @AllowNull(false)
  @Column({ type: STRING })
  token: string;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  user_id: number;

  @BelongsTo(() => User)
  users: User;
}
