import { INTEGER, DATE, BOOLEAN } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { Reservation, Camper } from '.';

@Table({
  tableName: 'camper_reservations',
  underscored: true,
  timestamps: true,
})
export class CamperReservation extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Reservation)
  @Column({ type: INTEGER })
  reservation_id: number;

  @ForeignKey(() => Camper)
  @Column({ type: INTEGER })
  camper_id: number;

  @Column({ type: BOOLEAN })
  checked_in: boolean;

  @Column({ type: DATE })
  checked_in_time: Date;

  @Column({ type: INTEGER })
  status: number;

  @Column({ type: INTEGER })
  covid_status: number;

  @BelongsTo(() => Camper)
  campers: Camper[];

  @BelongsTo(() => Reservation)
  reservations: Reservation[];
}
