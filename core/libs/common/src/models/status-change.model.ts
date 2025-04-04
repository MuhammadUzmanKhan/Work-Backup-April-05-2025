import { STRING, INTEGER, NUMBER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  AutoIncrement,
} from 'sequelize-typescript';
import { Incident, LostAndFound, ServiceRequest } from '.';

@Table({
  tableName: 'status_changes',
  underscored: true,
  timestamps: true,
})
export class StatusChange extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  status: string;

  @Column({ type: NUMBER })
  status_changeable_id: number;

  @Column({ type: STRING })
  status_changeable_type: string;

  @Column({ type: INTEGER })
  updated_by: number;

  @BelongsTo(() => Incident, {
    foreignKey: 'status_changeable_id',
    constraints: false,
  })
  incident: Incident;

  @BelongsTo(() => LostAndFound, {
    foreignKey: 'status_changeable_id',
    constraints: false,
  })
  lost_and_found: LostAndFound;

  @BelongsTo(() => ServiceRequest, {
    foreignKey: 'status_changeable_id',
    constraints: false,
  })
  service_request: ServiceRequest;
}
