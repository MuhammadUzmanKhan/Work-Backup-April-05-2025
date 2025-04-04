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
import { Route, Shift } from '.';

@Table({
  tableName: 'route_shifts',
  underscored: true,
  timestamps: true,
})
export class RouteShift extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Route)
  @Column({ type: INTEGER })
  route_id: number;

  @ForeignKey(() => Shift)
  @Column({ type: INTEGER })
  shift_id: number;

  @BelongsTo(() => Route)
  route: Route;

  @BelongsTo(() => Shift)
  shift: Shift;
}
