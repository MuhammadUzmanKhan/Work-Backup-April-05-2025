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
import { Department, Inventory, User, Event } from '.';

@Table({
  tableName: 'assignments',
  underscored: true,
  timestamps: true,
})
export class Assignment extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Inventory)
  @Column({ type: INTEGER })
  inventory_id: number;

  @ForeignKey(() => Department)
  @Column({ type: INTEGER })
  department_id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  user_id: number;

  @BelongsTo(() => Inventory)
  inventory: Inventory;

  @BelongsTo(() => Department)
  department: Department;

  @BelongsTo(() => Event)
  event: Event;

  @BelongsTo(() => User)
  user: User;
}
