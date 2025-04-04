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
import { Day, Route } from '.';

@Table({
  tableName: 'day_routes',
  underscored: true,
  timestamps: true,
})
export class DayRoute extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Day)
  @Column({ type: INTEGER })
  day_id: number;

  @ForeignKey(() => Route)
  @Column({ type: INTEGER })
  route_id: number;

  @BelongsTo(() => Day)
  day: Day;

  @BelongsTo(() => Route)
  route: Route;
}
