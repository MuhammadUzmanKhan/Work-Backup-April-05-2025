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
import { Inventory, InventoryZone } from '.';

@Table({
  tableName: 'inventory_inventory_zones',
  underscored: true,
  timestamps: true,
})
export class InventoryInventoryZone extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Inventory)
  @Column({ type: INTEGER })
  inventory_id: number;

  @ForeignKey(() => InventoryZone)
  @Column({ type: INTEGER })
  inventory_zone_id: number;

  @BelongsTo(() => Inventory)
  inventory: Inventory;

  @BelongsTo(() => InventoryZone)
  inventory_zone: InventoryZone;
}
