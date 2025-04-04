import {
  Table,
  Column,
  Model,
  DataType,
  BelongsToMany,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';

import { TaskStatus } from '../../modules/tasks/enums/task-status.enum';
import { UserTask } from './user-task.model';
import { User } from './users.model';

@Table
export class Task extends Model<Task> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  description: string;

  @Column({
    type: DataType.ENUM(...Object.values(TaskStatus)), // status type
    allowNull: false,
  })
  status: TaskStatus;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  startDate: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  endDate: Date;

  @BelongsToMany(() => User, () => UserTask)
  assignees: User[];

  @ForeignKey(() => Task)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  parentTaskId: number;

  @BelongsTo(() => Task, { as: 'ParentTask', foreignKey: 'parentTaskId' })
  parentTask: Task;

  @HasMany(() => Task, { as: 'SubTasks', foreignKey: 'parentTaskId' })
  subTasks: Task[];
}
