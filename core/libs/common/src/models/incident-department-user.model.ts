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
import { Department, Incident, User } from '.';

@Table({
  tableName: 'incident_department_users',
  underscored: true,
  timestamps: true,
})
export class IncidentDepartmentUsers extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Department)
  @Column({ type: INTEGER })
  department_id: number;

  @ForeignKey(() => Incident)
  @Column({ type: INTEGER })
  incident_id: number;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  user_id: number;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Department)
  department: Department;

  @BelongsTo(() => Incident)
  incident: Incident;
}
