import { STRING, BOOLEAN, INTEGER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AutoIncrement,
  BelongsTo,
  HasMany,
  BelongsToMany,
  BeforeDestroy,
  AfterDestroy,
} from 'sequelize-typescript';
import { HttpException, HttpStatus } from '@nestjs/common';
import {
  Company,
  DepartmentUsers,
  EventDepartment,
  IncidentDepartmentUsers,
  Incident,
  Inventory,
  User,
  Event,
  Scan,
  MessageGroup,
  InventoryType,
  IncidentForm,
  Assignment,
  EventDepartmentUser,
  Task,
  LiveVideo,
} from '.';

@Table({
  tableName: 'departments',
  underscored: true,
  timestamps: true,
})
export class Department extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  name: string;

  @ForeignKey(() => Company)
  @Column({ type: INTEGER })
  company_id: number;

  @HasMany(() => Task, { foreignKey: 'department_id' })
  tasks: Task[];

  @Column({ type: INTEGER })
  staff: number;

  @Column({ type: STRING })
  email: string;

  @Column({ type: STRING })
  contact_person: string;

  @Column({ type: STRING })
  phone: string;

  @Column({ type: BOOLEAN })
  is_hr_department: boolean;

  @BelongsTo(() => Company)
  company: Company;

  @HasMany(() => EventDepartment)
  event_departments: EventDepartment[];

  @BelongsToMany(() => Event, () => EventDepartment)
  events: Event[];

  @HasMany(() => Inventory)
  inventories: Inventory[];

  @HasMany(() => DepartmentUsers)
  department_users: DepartmentUsers[];

  @BelongsToMany(() => User, () => DepartmentUsers)
  users: User[];

  @HasMany(() => IncidentDepartmentUsers, { onDelete: 'CASCADE' })
  incident_department_users: IncidentDepartmentUsers[];

  @BelongsToMany(() => Incident, () => IncidentDepartmentUsers)
  incidents: Incident[];

  @HasMany(() => Scan)
  scans: Scan[];

  @HasMany(() => MessageGroup, {
    foreignKey: 'message_groupable_id',
    constraints: false,
    onDelete: 'CASCADE',
    scope: { message_groupable_type: 'Department' },
    as: 'message_groups',
  })
  message_groups: MessageGroup[];

  @HasMany(() => InventoryType)
  inventory_types: InventoryType[];

  @HasMany(() => IncidentForm)
  incident_forms: IncidentForm[];

  @HasMany(() => Assignment)
  assignments: Assignment[];

  @HasMany(() => EventDepartmentUser)
  event_department_users: EventDepartmentUser[];

  @HasMany(() => LiveVideo)
  live_videos: LiveVideo[];

  // hooks
  @BeforeDestroy
  static async checkDepartmentAssocaition(department: Department) {
    const { events, users, scans, message_groups, inventories } = department;

    const count =
      events.length +
      users.length +
      message_groups.length +
      scans.length +
      inventories.length;

    if (!count) {
      throw new HttpException(
        `Department has already been associated with other data, It can't be destroyed.`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @AfterDestroy
  static async unassignDepartmentFromTasks(department: Department) {
    // updating all task's department id to null where deleted department is assigned to these tasks
    await Task.update(
      { department_id: null },
      {
        where: {
          department_id: department.id,
        },
      },
    );
  }
}
