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
import { User, Day, Route } from '.';

@Table({
  tableName: 'user_routes',
  underscored: true,
  timestamps: true,
})
export class UserRoute extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  user_id: number;

  @ForeignKey(() => Route)
  @Column({ type: INTEGER })
  route_id: number;

  @ForeignKey(() => Day)
  @Column({ type: INTEGER })
  day_id: number;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Route)
  route: Route;

  @BelongsTo(() => Day)
  day: Day;
}
