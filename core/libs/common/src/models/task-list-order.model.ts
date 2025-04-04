import { BOOLEAN, INTEGER } from 'sequelize';
import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User, TaskList } from '.';

@Table({
  tableName: 'task_list_orders',
  underscored: true,
  timestamps: true, // Adds created_at and updated_at columns
})
export class TaskListOrder extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: INTEGER, allowNull: false })
  order: number;

  @ForeignKey(() => TaskList)
  @Column({ type: INTEGER, allowNull: false })
  task_list_id: number;

  @ForeignKey(() => User)
  @Column({ type: INTEGER, allowNull: false })
  user_id: number;

  @Column({ type: INTEGER, allowNull: false })
  event_id: number;

  @Column({ type: BOOLEAN, defaultValue: false })
  is_pinned: boolean;

  @BelongsTo(() => TaskList)
  task_list: TaskList;

  @BelongsTo(() => User)
  user: User;
}
