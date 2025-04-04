import { INTEGER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AutoIncrement,
  BelongsTo,
} from 'sequelize-typescript';
import { Inventory, User } from '.';

@Table({
  tableName: 'user_inventories',
  underscored: true,
  timestamps: true,
})
export class UserInventory extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  user_id: number;

  @ForeignKey(() => Inventory)
  @Column({ type: INTEGER })
  inventory_id: number;

  @BelongsTo(() => Inventory)
  inventory: Inventory;

  @BelongsTo(() => User)
  user: User;
}
