import { INTEGER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Event, InventoryTypeCategory } from '.';

@Table({
  tableName: 'event_inventory_type_categories',
  underscored: true,
  timestamps: true,
})
export class EventInventoryTypeCategory extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @ForeignKey(() => InventoryTypeCategory)
  @Column({ type: INTEGER })
  inventory_type_category_id: number;

  @BelongsTo(() => Event)
  event: Event;

  @BelongsTo(() => InventoryTypeCategory)
  inventory_type_category: InventoryTypeCategory;
}
