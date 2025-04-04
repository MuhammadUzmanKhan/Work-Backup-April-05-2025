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
import { Incident, IncidentDivision } from '.';

@Table({
  tableName: 'incident_multiple_divisions',
  underscored: true,
  timestamps: true,
})
export class IncidentMultipleDivision extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Incident)
  @Column({ type: INTEGER })
  incident_id: number;

  @ForeignKey(() => IncidentDivision)
  @Column({ type: INTEGER })
  incident_division_id: number;

  @BelongsTo(() => IncidentDivision)
  incident_division: IncidentDivision;

  @BelongsTo(() => Incident)
  incident: Incident;
}
