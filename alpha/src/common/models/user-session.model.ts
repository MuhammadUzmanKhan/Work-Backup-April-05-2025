import {
  AllowNull,
  Column,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  BelongsTo,
} from 'sequelize-typescript';
import { TEXT, UUID, UUIDV4 } from 'sequelize';
import { Users } from './user.model';

@Table({
  tableName: 'user_sessions',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class UserSessions extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @Column({ type: TEXT })
  fcmToken: string;

  @PrimaryKey
  @AllowNull(false)
  @Column({ type: UUID, defaultValue: UUIDV4 })
  sessionToken: string;

  @ForeignKey(() => Users)
  @AllowNull(false)
  @Column({ type: UUID })
  userId: string;

  @BelongsTo(() => Users)
  user: Users;
}
