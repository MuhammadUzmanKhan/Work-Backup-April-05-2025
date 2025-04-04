import { DOUBLE, INTEGER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AutoIncrement,
  BelongsTo,
} from 'sequelize-typescript';
import { Event, Vendor } from '.';

@Table({
  tableName: 'event_vendors',
  underscored: true,
  timestamps: true,
})
export class EventVendors extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @ForeignKey(() => Vendor)
  @Column({ type: INTEGER })
  vendor_id: number;

  @Column({ type: DOUBLE })
  staff_overage: number;

  @Column({ type: DOUBLE })
  breaks_adjustment: number;

  @BelongsTo(() => Event)
  event: Event;

  @BelongsTo(() => Vendor)
  vendor: Vendor;
}
