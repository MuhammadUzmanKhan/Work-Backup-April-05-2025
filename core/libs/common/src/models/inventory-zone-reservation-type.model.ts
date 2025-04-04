import { INTEGER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AutoIncrement,
  BelongsTo,
  ForeignKey,
} from 'sequelize-typescript';
import { InventoryZone, ReservationType } from '.';

@Table({
  tableName: 'inventory_zone_reservation_types',
  underscored: true,
  timestamps: true,
})
export class InventoryZoneReservationType extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => InventoryZone)
  @Column({ type: INTEGER })
  inventory_zone_id: number;

  @ForeignKey(() => ReservationType)
  @Column({ type: INTEGER })
  reservation_type_id: number;

  @Column({ type: INTEGER })
  event_id: number;

  @BelongsTo(() => ReservationType)
  reservation_type: ReservationType;

  @BelongsTo(() => InventoryZone)
  inventory_zone: InventoryZone;
}
