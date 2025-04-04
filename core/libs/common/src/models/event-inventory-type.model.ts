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
import { Event, InventoryType } from '.';

@Table({
  tableName: 'event_inventory_types',
  underscored: true,
  timestamps: true,
})
export class EventInventoryType extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @ForeignKey(() => InventoryType)
  @Column({ type: INTEGER })
  inventory_type_id: number;

  @BelongsTo(() => Event)
  event: Event;

  @BelongsTo(() => InventoryType)
  inventory_type: InventoryType;
}
