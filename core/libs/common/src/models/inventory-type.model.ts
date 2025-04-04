import { STRING, BOOLEAN, INTEGER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AutoIncrement,
  BelongsTo,
  HasOne,
  HasMany,
  BelongsToMany,
  ForeignKey,
} from 'sequelize-typescript';
import {
  Company,
  Department,
  InventoryTypeCategory,
  Image,
  Inventory,
  EventInventoryType,
  Event,
  Damage,
} from '.';

@Table({
  tableName: 'inventory_types',
  underscored: true,
  timestamps: true,
})
export class InventoryType extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  name: string;

  @Column({ type: INTEGER })
  capacity: number;

  @ForeignKey(() => InventoryTypeCategory)
  @Column({ type: INTEGER })
  inventory_type_category_id: number;

  @ForeignKey(() => Company)
  @Column({ type: INTEGER })
  company_id: number;

  @ForeignKey(() => Department)
  @Column({ type: INTEGER })
  department_id: number;

  @Column({ type: STRING })
  color: string;

  @Column({ type: BOOLEAN })
  is_lot: boolean;

  @BelongsTo(() => InventoryTypeCategory)
  inventory_type_category: InventoryTypeCategory;

  @BelongsTo(() => Company)
  company: Company;

  @BelongsTo(() => Department)
  department: Department;

  @HasOne(() => Image, {
    foreignKey: 'imageable_id',
    constraints: false,
    scope: { imageable_type: 'InventoryType' },
    as: 'inventory_type_image',
    onDelete: 'CASCADE',
  })
  inventory_type_image: Image;

  @HasMany(() => Inventory)
  inventories: Inventory[];

  @HasMany(() => EventInventoryType)
  event_inventory_types: EventInventoryType[];

  @BelongsToMany(() => Event, () => EventInventoryType)
  events: Event[];

  @HasMany(() => Damage)
  damage: Damage[];
}
