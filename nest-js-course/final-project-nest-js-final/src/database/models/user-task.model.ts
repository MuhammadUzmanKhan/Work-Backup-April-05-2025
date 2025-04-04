import { Table, Column, Model, ForeignKey } from 'sequelize-typescript';

import { Task } from './tasks.model';
import { User } from './users.model';

@Table
export class UserTask extends Model<UserTask> {
  @ForeignKey(() => User)
  @Column
  userId: number;

  @ForeignKey(() => Task)
  @Column
  taskId: number;
}
