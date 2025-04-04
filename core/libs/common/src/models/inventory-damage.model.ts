import { STRING, INTEGER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AutoIncrement,
  BelongsTo,
  ForeignKey,
} from 'sequelize-typescript';
import { Damage, Event, Inventory, Reservation } from '.';

@Table({
  tableName: 'inventory_damages',
  underscored: true,
  timestamps: true,
})
export class InventoryDamage extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  note: string;

  @Column({ type: INTEGER })
  status: number;

  @ForeignKey(() => Inventory)
  @Column({ type: INTEGER })
  inventory_id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @ForeignKey(() => Reservation)
  @Column({ type: INTEGER })
  reservation_id: number;

  @ForeignKey(() => Damage)
  @Column({ type: INTEGER })
  damage_id: number;

  @BelongsTo(() => Inventory)
  inventory: Inventory;

  @BelongsTo(() => Event)
  event: Event;

  @BelongsTo(() => Damage)
  damage: Damage;

  @BelongsTo(() => Reservation)
  reservation: Reservation;
}
