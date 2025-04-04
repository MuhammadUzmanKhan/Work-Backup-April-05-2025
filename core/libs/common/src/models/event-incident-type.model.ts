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
import { Event, IncidentType } from '.';

@Table({
  tableName: 'event_incident_types',
  underscored: true,
  timestamps: true,
})
export class EventIncidentType extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @ForeignKey(() => IncidentType)
  @Column({ type: INTEGER })
  incident_type_id: number;

  @BelongsTo(() => Event)
  events: Event;

  @BelongsTo(() => IncidentType)
  incident_type: IncidentType;
}
