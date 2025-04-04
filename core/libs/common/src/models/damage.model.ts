import { STRING, INTEGER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AutoIncrement,
  BelongsTo,
  ForeignKey,
  HasMany,
} from 'sequelize-typescript';
import { Event, InventoryDamage, InventoryType } from '.';

@Table({
  tableName: 'damages',
  underscored: true,
  timestamps: true,
})
export class Damage extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  note: string;

  @Column({ type: STRING })
  title: string;

  @Column({ type: INTEGER })
  cost: number;

  @ForeignKey(() => InventoryType)
  @Column({ type: INTEGER })
  inventory_type_id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @BelongsTo(() => InventoryType)
  inventory_type: InventoryType;

  @BelongsTo(() => Event)
  event: Event;

  @HasMany(() => InventoryDamage)
  inventory_damage: InventoryDamage[];
}
