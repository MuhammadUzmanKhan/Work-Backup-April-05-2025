import { STRING, INTEGER, BOOLEAN, DOUBLE } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AutoIncrement,
  BelongsTo,
  HasMany,
  HasOne,
} from 'sequelize-typescript';
import { PolymorphicType } from '../constants';
import { Event, Image, Incident, IncidentForm } from '.';

@Table({
  tableName: 'incident_zones',
  underscored: true,
  timestamps: true,
})
export class IncidentZone extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @Column({ type: STRING })
  name: string;

  @Column({ type: DOUBLE })
  latitude: number;

  @Column({ type: DOUBLE })
  longitude: number;

  @Column({ type: STRING })
  color: string;

  @Column({ type: STRING })
  linked_incidents_avg_resolved_time: string;

  @Column({ type: INTEGER })
  sequence: number;

  @Column({ type: INTEGER })
  parent_id: number;

  @Column({ type: BOOLEAN })
  is_test: boolean;

  @BelongsTo(() => Event)
  event: Event;

  @HasMany(() => Incident)
  incidents: Incident[];

  @HasMany(() => IncidentZone, { foreignKey: 'parent_id' })
  incident_sub_zones: IncidentZone[];

  @BelongsTo(() => IncidentZone, { foreignKey: 'parent_id' })
  parent: IncidentZone;

  @HasOne(() => Image, {
    foreignKey: 'imageable_id',
    scope: { imageable_type: PolymorphicType.INCIDENT_ZONE },
    as: 'incident_zone_image',
    onDelete: 'CASCADE',
  })
  incident_zone_image: Image;

  @HasMany(() => IncidentForm)
  incident_forms: IncidentForm[];
}
