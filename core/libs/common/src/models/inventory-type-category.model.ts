import { STRING, BOOLEAN, INTEGER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AutoIncrement,
  HasMany,
  ForeignKey,
  BelongsToMany,
  BelongsTo,
} from 'sequelize-typescript';
import { Company, Event, EventInventoryTypeCategory, InventoryType } from '.';

@Table({
  tableName: 'inventory_type_categories',
  underscored: true,
  timestamps: true,
})
export class InventoryTypeCategory extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  name: string;

  @ForeignKey(() => Company)
  @Column({ type: INTEGER })
  company_id: number;

  @Column({ type: BOOLEAN })
  is_lot: boolean;

  @HasMany(() => InventoryType)
  inventory_types: InventoryType[];

  @HasMany(() => EventInventoryTypeCategory)
  event_inventory_type_categories: EventInventoryTypeCategory[];

  @BelongsToMany(() => Event, () => EventInventoryTypeCategory)
  events: Event[];

  @BelongsTo(() => Company)
  company: Company;
}
