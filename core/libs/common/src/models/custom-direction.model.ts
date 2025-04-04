import { STRING, INTEGER, NUMBER } from 'sequelize';
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
  tableName: 'custom_directions',
  underscored: true,
  timestamps: true,
})
export class CustomDirection extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  direction: string;

  @Column({ type: STRING })
  note: string;

  @Column({ type: STRING })
  route_type: string;

  @ForeignKey(() => Route)
  @Column({ type: NUMBER })
  route_id: number;

  @Column({ type: INTEGER })
  sequence: number;

  @BelongsTo(() => Route)
  route: Route;
}
