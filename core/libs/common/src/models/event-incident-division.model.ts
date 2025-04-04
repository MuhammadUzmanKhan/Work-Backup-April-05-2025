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
import { Event, IncidentDivision, Task } from '.';

@Table({
  tableName: 'event_incident_divisions',
  underscored: true,
  timestamps: true,
})
export class EventIncidentDivision extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @ForeignKey(() => IncidentDivision)
  @Column({ type: INTEGER })
  incident_division_id: number;

  @BelongsTo(() => Event)
  events: Event;

  @BelongsTo(() => IncidentDivision)
  incident_division: IncidentDivision;

  // hooks
  @AfterDestroy
  static async unassignDivisionFromTasks(
    event_incident_division: EventIncidentDivision,
  ) {
    // updating all task's incident division id to null when unlink incident division to event
    await Task.update(
      { incident_division_id: null },
      {
        where: {
          incident_division_id: event_incident_division.incident_division_id,
          event_id: event_incident_division.event_id,
        },
      },
    );
  }
}
