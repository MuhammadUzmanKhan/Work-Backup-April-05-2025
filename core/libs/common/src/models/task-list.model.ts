import { INTEGER, STRING, BOOLEAN } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AutoIncrement,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { Event, Task, TaskListOrder, UserPins } from '.';
import { PinableType } from '../constants';

@Table({
  tableName: 'task_lists',
  underscored: true,
  timestamps: true,
})
export class TaskList extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  name: string;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @Column({ type: INTEGER })
  order: number;

  @Column({ type: BOOLEAN, defaultValue: false })
  is_pinned: boolean;

  @Column({ type: INTEGER })
  created_by: number;

  @Column({ type: BOOLEAN, defaultValue: false })
  is_division_locked: boolean;

  @Column({ type: BOOLEAN, defaultValue: false })
  is_date_locked: boolean;

  @Column({ type: BOOLEAN, defaultValue: false })
  is_private: boolean;

  @BelongsTo(() => Event)
  event: Event;

  @HasMany(() => Task)
  tasks: Task[];

  @HasMany(() => UserPins, {
    foreignKey: 'pinable_id',
    constraints: false,
    scope: { pinable_type: PinableType.TASK_LIST },
    as: 'pinnedTaskLists',
  })
  pinnedTaskLists: UserPins[];

  @HasMany(() => TaskListOrder, { onDelete: 'CASCADE' })
  task_list_orders: TaskListOrder[];
}
