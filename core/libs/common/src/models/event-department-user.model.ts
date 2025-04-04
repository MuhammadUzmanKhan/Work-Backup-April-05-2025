import { INTEGER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { Event, Department, User } from '.';

@Table({
  tableName: 'event_department-users',
  underscored: true,
  timestamps: true,
})
export class EventDepartmentUser extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @ForeignKey(() => Department)
  @Column({ type: INTEGER })
  department_id: number;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  user_id: number;

  @BelongsTo(() => Event)
  event: Event;

  @BelongsTo(() => Department)
  department: Department;

  @BelongsTo(() => User)
  user: Event;
}
