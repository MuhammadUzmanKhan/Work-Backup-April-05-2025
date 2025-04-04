import { INTEGER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
  AfterDestroy,
} from 'sequelize-typescript';
import { Event, Department, Task } from '.';

@Table({
  tableName: 'event_departments',
  underscored: true,
  timestamps: true,
})
export class EventDepartment extends Model {
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

  @BelongsTo(() => Event)
  event: Event;

  @BelongsTo(() => Department)
  department: Department;

  // hooks
  @AfterDestroy
  static async unassignDepartmentFromTasks(event_department: EventDepartment) {
    // updating all task's department id to null when unlink depatment to event
    await Task.update(
      { department_id: null },
      {
        where: {
          department_id: event_department.department_id,
          event_id: event_department.event_id,
        },
      },
    );
  }
}
