import { STRING, INTEGER, NUMBER, DOUBLE, FLOAT } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AutoIncrement,
  BelongsTo,
  ForeignKey,
  HasMany,
} from 'sequelize-typescript';
import { Route, Event, Scan } from '.';

@Table({
  tableName: 'zones',
  underscored: true,
  timestamps: true,
})
export class Zone extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  name: string;

  @Column({ type: DOUBLE })
  latitude: number;

  @Column({ type: DOUBLE })
  longitude: number;

  @ForeignKey(() => Route)
  @Column({ type: NUMBER })
  route_id: number;

  @Column({ type: NUMBER })
  point: number;

  @ForeignKey(() => Event)
  @Column({ type: NUMBER })
  event_id: number;

  @Column({ type: FLOAT })
  geo_fence: number;

  @Column({ type: STRING })
  route_type: string;

  @Column({ type: STRING })
  color: string;

  @BelongsTo(() => Route)
  route: Route;

  @BelongsTo(() => Event)
  event: Event;

  @HasMany(() => Scan)
  scans: Scan[];
}
