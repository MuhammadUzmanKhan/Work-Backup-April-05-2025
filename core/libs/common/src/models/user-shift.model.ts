import { INTEGER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User, Day, Shift } from '.';

@Table({
  tableName: 'user_shifts',
  underscored: true,
  timestamps: true,
})
export class UserShift extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  user_id: number;

  @ForeignKey(() => Shift)
  @Column({ type: INTEGER })
  shift_id: number;

  @ForeignKey(() => Day)
  @Column({ type: INTEGER })
  day_id: number;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Shift)
  shift: Shift;

  @BelongsTo(() => Day)
  day: Day;
}
