import { STRING, INTEGER, DATE, NUMBER, FLOAT } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { Event, ReservationType } from '.';

@Table({
  tableName: 'reservation_statistics',
  underscored: true,
  timestamps: true,
})
export class ReservationStatistic extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Event)
  @Column({ type: NUMBER })
  event_id: number;

  @Column({ type: STRING })
  statistic_type: string;

  @Column({ type: NUMBER })
  total: number;

  @Column({ type: NUMBER })
  arrived: number;

  @Column({ type: NUMBER })
  checked_in: number;

  @Column({ type: NUMBER })
  assigned: number;

  @Column({ type: NUMBER })
  occupied: number;

  @Column({ type: NUMBER })
  checked_out: number;

  @Column({ type: NUMBER })
  average_pr_hour: number;

  @Column({ type: NUMBER })
  waiting: number;

  @Column({ type: NUMBER })
  remaining: number;

  @Column({ type: DATE })
  start_time: Date;

  @Column({ type: DATE })
  end_time: Date;

  @ForeignKey(() => ReservationType)
  @Column({ type: NUMBER })
  reservation_type_id: number;

  @Column({ type: NUMBER })
  deposited: number;

  @Column({ type: FLOAT })
  amount: number;

  @BelongsTo(() => Event)
  event: Event[];

  @BelongsTo(() => ReservationType)
  inventory: ReservationType[];
}
