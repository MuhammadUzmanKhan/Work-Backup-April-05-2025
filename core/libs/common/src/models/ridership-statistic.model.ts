import { STRING, INTEGER, DATE } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AutoIncrement,
  BelongsTo,
} from 'sequelize-typescript';
import { Day, Event, Route, Shift } from '.';

@Table({
  tableName: 'ridership_statistics',
  underscored: true,
  timestamps: true,
})
export class RidershipStatistics extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: INTEGER })
  total: number;

  @Column({ type: STRING })
  ridership_type: string;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @ForeignKey(() => Day)
  @Column({ type: INTEGER })
  day_id: number;

  @ForeignKey(() => Shift)
  @Column({ type: INTEGER })
  shift_id: number;

  @ForeignKey(() => Route)
  @Column({ type: INTEGER })
  route_id: number;

  @Column({ type: INTEGER })
  passenger_count: number;

  @Column({ type: DATE })
  start_time: Date;

  @Column({ type: DATE })
  end_time: Date;

  //TODO: Add foreign key when model will be create.
  @Column({ type: INTEGER })
  zone_id: number;

  @BelongsTo(() => Event)
  event: Event;

  @BelongsTo(() => Day)
  day: Day;

  @BelongsTo(() => Shift)
  shift: Shift;

  @BelongsTo(() => Route)
  route: Route;
}
