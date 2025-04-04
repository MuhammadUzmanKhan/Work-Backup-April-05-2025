import { STRING, INTEGER, BOOLEAN } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AutoIncrement,
  HasMany,
  BelongsTo,
  BelongsToMany,
  AfterDestroy,
} from 'sequelize-typescript';
import {
  Company,
  Event,
  EventIncidentDivision,
  Incident,
  MessageGroup,
  User,
  UserIncidentDivision,
  IncidentMultipleDivision,
  Task,
} from '.';
import { MessageGroupableType } from '../constants';

@Table({
  tableName: 'incident_divisions',
  underscored: true,
  timestamps: true,
})
export class IncidentDivision extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  name: string;

  @ForeignKey(() => Company)
  @Column({ type: INTEGER })
  company_id: number;

  @Column({ type: BOOLEAN })
  is_test: boolean;

  @HasMany(() => EventIncidentDivision)
  event_incident_divisions: EventIncidentDivision[];

  @BelongsToMany(() => Event, () => EventIncidentDivision)
  events: Event[];

  @BelongsTo(() => Company)
  company: Company;

  @HasMany(() => UserIncidentDivision)
  user_incident_divisions: UserIncidentDivision[];

  @BelongsToMany(() => User, () => UserIncidentDivision)
  users: User[];

  @HasMany(() => Incident)
  incidents: Incident[];

  @HasMany(() => MessageGroup, {
    foreignKey: 'message_groupable_id',
    constraints: false,
    onDelete: 'CASCADE',
    scope: { message_groupable_type: MessageGroupableType.INCIDENT_DIVISION },
    as: 'message_groups',
  })
  message_groups: MessageGroup[];

  @HasMany(() => IncidentMultipleDivision)
  incident_multiple_division: IncidentMultipleDivision[];

  // hooks
  @AfterDestroy
  static async unassignDivisionFromTasks(incident_division: IncidentDivision) {
    // updating all task's incident division id to null where deleted incident division is assigned to these tasks
    await Task.update(
      { incident_division_id: null },
      {
        where: {
          incident_division_id: incident_division.id,
        },
      },
    );
  }
}
