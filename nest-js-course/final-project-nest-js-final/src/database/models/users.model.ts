import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  BelongsToMany,
} from 'sequelize-typescript';

import { Notification } from 'src/database/models/notifications.models';

import { UserRole } from '../../modules/users/enums/user-roles.enum';
import { UserTask } from './user-task.model';
import { Task } from './tasks.model';

@Table
export class User extends Model<User> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  username: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  email: string;

  @Column
  password: string;

  @Column({
    type: DataType.ENUM(UserRole.ADMIN, UserRole.USER),
    allowNull: false,
    defaultValue: UserRole.USER,
  })
  role: UserRole;

  @BelongsToMany(() => Task, () => UserTask)
  tasks: Task[];

  @HasMany(() => Notification)
  notifications: Notification[];
}
