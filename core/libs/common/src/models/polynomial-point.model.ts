import { STRING, INTEGER, NUMBER, DOUBLE } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AutoIncrement,
  BelongsTo,
  ForeignKey,
} from 'sequelize-typescript';
import { Route } from '.';

@Table({
  tableName: 'polynomial_points',
  underscored: true,
  timestamps: true,
})
export class PolynomialPoint extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Route)
  @Column({ type: NUMBER })
  route_id: number;

  @Column({ type: DOUBLE })
  latitude: number;

  @Column({ type: DOUBLE })
  longitude: number;

  @Column({ type: STRING })
  routetype: string;

  @BelongsTo(() => Route)
  route: Route;
}
